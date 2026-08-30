import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GenericStatus, Prisma } from '@prisma/client';
import { hardDeleteAccountCascade } from '../accounts/utils/hard-delete-account-cascade.util';
import { DELETED_RECORD_RETENTION_DAYS } from '../common/constants/deleted-record-retention-days.const';
import { subUtcDays } from '../common/utils/utc-date.util';
import { PrismaService } from '../core/prisma/prisma.service';

@Injectable()
export class AccountsCronService {
  private readonly logger = new Logger(AccountsCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeDeletedAccounts(): Promise<void> {
    const cutoff = subUtcDays(new Date(), DELETED_RECORD_RETENTION_DAYS);

    const staleAccounts = await this.prisma.account.findMany({
      where: {
        status: GenericStatus.deleted,
        editAt: { lte: cutoff },
      },
      select: { idAccount: true },
    });

    if (staleAccounts.length === 0) {
      this.logger.log('CRON: Permanently purged 0 deleted accounts');
      return;
    }

    for (const account of staleAccounts) {
      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await hardDeleteAccountCascade(tx, account.idAccount);
      });
    }

    this.logger.log(
      `CRON: Permanently purged ${staleAccounts.length} deleted accounts`,
    );
  }
}
