import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AccountType, CrowdmeterDay, GenericStatus } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { subUtcDays } from '../common/utils/utc-date.util';
import { buildCrowdmeterData } from './utils/crowdmeter-bucket.util';
import { getCrowdmeterDayForDate } from './utils/crowdmeter-day.util';

const RETENTION_DAYS = 30;
const LIVE_WINDOW_MINUTES = 75;
const LIVE_STALE_MINUTES = 15;
const EVERY_15_MINUTES = '0 */15 * * * *';

type EntryLogDateRow = {
  entryDate: Date;
};

type LiveCrowdmeterTimestampRow = {
  updatedAt: Date;
};

@Injectable()
export class EntryLogsCronService implements OnModuleInit {
  private readonly logger = new Logger(EntryLogsCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    const [liveCrowdmeter] = await this.prisma.$queryRaw<
      LiveCrowdmeterTimestampRow[]
    >`
      SELECT updated_at AS "updatedAt"
      FROM "Crowdmeter"
      WHERE identifier = 'now'
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    const isMissing = liveCrowdmeter === undefined;
    const isStale =
      liveCrowdmeter !== undefined &&
      Date.now() - liveCrowdmeter.updatedAt.getTime() >
        LIVE_STALE_MINUTES * 60 * 1000;

    if (isMissing || isStale) {
      this.logger.log(
        'WakeUp Check: Live capacity is stale or missing. Forcing immediate calculation.',
      );
      await this.calculateLiveCrowdmeter();
    }
  }

  @Cron(EVERY_15_MINUTES)
  async calculateLiveCrowdmeter(): Promise<void> {
    const liveBucket = this.getLiveCrowdmeterBucket(new Date());
    const cutoffTime = new Date(Date.now() - LIVE_WINDOW_MINUTES * 60 * 1000);
    const accountDetails = await this.prisma.accountDetail.findMany({
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

    for (const detail of accountDetails) {
      const recentEntriesCount = await this.prisma.entryLog.count({
        where: {
          idAccount: detail.idAccount,
          entryDate: { gte: cutoffTime },
        },
      });
      const percentage =
        detail.maxCapacity > 0
          ? Math.round((recentEntriesCount / detail.maxCapacity) * 100)
          : 0;
      const calculatedPercentage = Math.min(percentage, 100);

      await this.prisma.crowdmeter.upsert({
        where: {
          id_account_identifier: {
            id_account: detail.idAccount,
            identifier: CrowdmeterDay.now,
          },
        },
        update: { data: { [liveBucket]: calculatedPercentage } },
        create: {
          id_account: detail.idAccount,
          identifier: CrowdmeterDay.now,
          data: { [liveBucket]: calculatedPercentage },
        },
      });
    }

    this.logger.log(
      `CRON: Upserted live crowdmeter data for ${accountDetails.length} active gym accounts using a ${LIVE_WINDOW_MINUTES}-minute rolling window`,
    );
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
