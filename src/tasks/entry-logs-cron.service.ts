import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AccountType, CrowdmeterDay, GenericStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { ENTRY_LOG_RETENTION_DAYS as RETENTION_DAYS } from '../common/constants/entry-log-retention-days.const';
import { subUtcDays } from '../common/utils/utc-date.util';
import { buildCrowdmeterData } from './utils/crowdmeter-bucket.util';
import { getCrowdmeterDayForDate } from './utils/crowdmeter-day.util';

const LIVE_WINDOW_MS = 75 * 60 * 1000;
const LIVE_STALE_MS = 15 * 60 * 1000;
const LIVE_STEP_MS = 15 * 60 * 1000;
const LIVE_CATCHUP_MS = 24 * 60 * 60 * 1000;
const LIVE_MAX_STEPS = 96;

type EntryLogDateRow = {
  entryDate: Date;
};

type LiveCapacityAccount = {
  idAccount: number;
  maxCapacity: number;
};

@Injectable()
export class EntryLogsCronService {
  private readonly logger = new Logger(EntryLogsCronService.name);
  private lastCapacityUpdate = 0;
  private inFlight: Promise<void> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /** Fire-and-forget. Metrics and check-in must not wait on this pass. */
  scheduleLiveRefresh(): void {
    void this.ensureLiveRefresh().catch((error: unknown) => {
      this.logger.error('Live crowdmeter refresh failed', error);
    });
  }

  /** Crowdmeter reads wait so the response is the row written by this pass. */
  async awaitLiveRefresh(): Promise<void> {
    try {
      await this.ensureLiveRefresh();
    } catch (error: unknown) {
      this.logger.error('Live crowdmeter refresh failed', error);
    }
  }

  private ensureLiveRefresh(): Promise<void> {
    const now = Date.now();
    if (this.inFlight) {
      return this.inFlight;
    }
    if (
      this.lastCapacityUpdate !== 0 &&
      now - this.lastCapacityUpdate <= LIVE_STALE_MS
    ) {
      return Promise.resolve();
    }

    const run = this.runGlobalLiveRefresh(now).finally(() => {
      if (this.inFlight === run) {
        this.inFlight = null;
      }
    });
    this.inFlight = run;
    return run;
  }

  private async runGlobalLiveRefresh(nowMs: number): Promise<void> {
    const steps = this.buildLiveSteps(nowMs);
    const accounts = await this.prisma.accountDetail.findMany({
      where: {
        account: {
          type: AccountType.pro,
          status: GenericStatus.active,
        },
      },
      select: {
        idAccount: true,
        maxCapacity: true,
      },
    });

    if (steps.length > 0 && accounts.length > 0) {
      const existingRows = await this.prisma.crowdmeter.findMany({
        where: {
          identifier: CrowdmeterDay.now,
          id_account: { in: accounts.map((account) => account.idAccount) },
        },
        select: { id_account: true, data: true },
      });
      const existingByAccount = new Map(
        existingRows.map((row) => [row.id_account, row.data]),
      );
      const windowStart = new Date(steps[0] - LIVE_WINDOW_MS);

      for (const account of accounts) {
        await this.refreshAccountLiveCrowdmeter(
          account,
          steps,
          windowStart,
          nowMs,
          existingByAccount.get(account.idAccount),
        );
      }
    }

    this.lastCapacityUpdate = Date.now();
    this.logger.log(
      `Live crowdmeter: refreshed ${accounts.length} pro accounts across ${steps.length} steps`,
    );
  }

  private buildLiveSteps(nowMs: number): number[] {
    let origin = this.lastCapacityUpdate === 0
      ? nowMs - LIVE_CATCHUP_MS
      : this.lastCapacityUpdate;
    if (nowMs - origin > LIVE_CATCHUP_MS) {
      origin = nowMs - LIVE_CATCHUP_MS;
    }

    const steps: number[] = [];
    for (
      let step = origin + LIVE_STEP_MS;
      step <= nowMs && steps.length < LIVE_MAX_STEPS;
      step += LIVE_STEP_MS
    ) {
      steps.push(step);
    }
    return steps;
  }

  private async refreshAccountLiveCrowdmeter(
    account: LiveCapacityAccount,
    steps: number[],
    windowStart: Date,
    nowMs: number,
    existing: Prisma.JsonValue | undefined,
  ): Promise<void> {
    const rows = await this.prisma.entryLog.findMany({
      where: {
        idAccount: account.idAccount,
        entryDate: { gte: windowStart, lte: new Date(nowMs) },
      },
      select: { entryDate: true },
    });
    const entryTimes = rows
      .map((row) => row.entryDate.getTime())
      .sort((left, right) => left - right);
    const sampled = this.sampleLiveBuckets(entryTimes, steps, account.maxCapacity);
    const data = { ...readCrowdmeterMap(existing), ...sampled };

    await this.prisma.crowdmeter.upsert({
      where: {
        id_account_identifier: {
          id_account: account.idAccount,
          identifier: CrowdmeterDay.now,
        },
      },
      update: { data },
      create: {
        id_account: account.idAccount,
        identifier: CrowdmeterDay.now,
        data,
      },
    });
  }

  private sampleLiveBuckets(
    sortedEntryTimes: number[],
    steps: number[],
    maxCapacity: number,
  ): Record<string, number> {
    const buckets: Record<string, number> = {};
    let cursor = 0;

    for (const step of steps) {
      const windowStart = step - LIVE_WINDOW_MS;
      while (
        cursor < sortedEntryTimes.length &&
        sortedEntryTimes[cursor] < windowStart
      ) {
        cursor += 1;
      }
      let count = 0;
      for (let index = cursor; index < sortedEntryTimes.length; index += 1) {
        if (sortedEntryTimes[index] > step) {
          break;
        }
        count += 1;
      }
      const percentage =
        maxCapacity > 0 ? Math.round((count / maxCapacity) * 100) : 0;
      buckets[this.getLiveCrowdmeterBucket(new Date(step))] = Math.min(
        percentage,
        100,
      );
    }

    return buckets;
  }

  private getLiveCrowdmeterBucket(date: Date): string {
    const hour = date.getHours();
    const suffix = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}${suffix}`;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeOldEntryLogs(): Promise<void> {
    const now = new Date();
    await this.generateCrowdmeterForAllAccounts(now);

    const cutoff = subUtcDays(new Date(), RETENTION_DAYS);
    const result = await this.prisma.entryLog.deleteMany({
      where: { entryDate: { lt: cutoff } },
    });
    this.logger.log(
      `CRON: Deleted ${result.count} entry_logs rows with entry_date before ${cutoff.toISOString()} (retention ${RETENTION_DAYS} UTC days)`,
    );
  }

  async generateCrowdmeterForAccount(
    accountId: number,
    targetDate: Date,
  ): Promise<void> {
    const identifier = getCrowdmeterDayForDate(targetDate);
    const utcDay = targetDate.getUTCDay();
    const detail = await this.prisma.accountDetail.findUnique({
      where: { idAccount: accountId },
      select: { maxCapacity: true },
    });

    if (!detail) {
      this.logger.warn(
        `CRON: Skipped crowdmeter generation for account ${accountId}; account_details row not found`,
      );
      return;
    }

    const entryDates = await this.findHistoricalEntryDatesForWeekday(
      accountId,
      utcDay,
    );
    const data = buildCrowdmeterData(entryDates, detail.maxCapacity);

    await this.prisma.crowdmeter.upsert({
      where: {
        id_account_identifier: {
          id_account: accountId,
          identifier,
        },
      },
      update: { data },
      create: {
        id_account: accountId,
        identifier,
        data,
      },
    });

    this.logger.log(
      `CRON: Upserted crowdmeter data for account ${accountId} using ${identifier} weekday identifier`,
    );
  }

  private async generateCrowdmeterForAllAccounts(now: Date): Promise<void> {
    const identifier = getCrowdmeterDayForDate(now);
    const accountDetails = await this.prisma.accountDetail.findMany({
      where: {
        account: {
          status: { not: GenericStatus.deleted },
        },
      },
      distinct: ['idAccount'],
      select: { idAccount: true },
    });

    for (const detail of accountDetails) {
      await this.generateCrowdmeterForAccount(detail.idAccount, now);
    }

    this.logger.log(
      `CRON: Upserted crowdmeter data for ${accountDetails.length} accounts using ${identifier} weekday identifier`,
    );
  }

  private async findHistoricalEntryDatesForWeekday(
    idAccount: number,
    utcDay: number,
  ): Promise<Date[]> {
    const rows = await this.prisma.$queryRaw<EntryLogDateRow[]>`
      SELECT entry_date AS "entryDate"
      FROM entry_logs
      WHERE id_account = ${idAccount}
        AND EXTRACT(DOW FROM entry_date) = ${utcDay}
    `;

    return rows.map((row) => row.entryDate);
  }
}

function readCrowdmeterMap(
  value: Prisma.JsonValue | undefined,
): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  const mapped: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      mapped[key] = raw;
    }
  }
  return mapped;
}
