import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../core/prisma/prisma.service';
import { subUtcDays } from '../common/utils/utc-date.util';

const RETENTION_DAYS = 45;

@Injectable()
export class EntryLogsCronService {
  private readonly logger = new Logger(EntryLogsCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeOldEntryLogs(): Promise<void> {
    const cutoff = subUtcDays(new Date(), RETENTION_DAYS);
    const result = await this.prisma.entryLog.deleteMany({
      where: { entryDate: { lt: cutoff } },
    });
    this.logger.log(
      `CRON: Deleted ${result.count} entry logs older than ${RETENTION_DAYS} days`,
    );
  }
}
