import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GenericStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { subUtcDays } from '../common/utils/utc-date.util';

const USER_RETENTION_DAYS = 30;

@Injectable()
export class UsersCronService {
  private readonly logger = new Logger(UsersCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeDeletedUsers(): Promise<void> {
    const thirtyDaysAgo = subUtcDays(new Date(), USER_RETENTION_DAYS);

    const staleUsers = await this.prisma.user.findMany({
      where: {
        status: GenericStatus.deleted,
        editAt: { lte: thirtyDaysAgo },
      },
      select: { idUser: true },
    });

    if (staleUsers.length === 0) {
      this.logger.log('CRON: Permanently purged 0 ghost users');
      return;
    }

    const userIds = staleUsers.map((user) => user.idUser);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.profile.updateMany({
        where: { idCoach: { in: userIds } },
        data: { idCoach: null },
      });

      await tx.featureFlag.deleteMany({
        where: { idUser: { in: userIds } },
      });

      await tx.entryLog.deleteMany({
        where: { idUser: { in: userIds } },
      });

      await tx.routine.deleteMany({
        where: { idUser: { in: userIds } },
      });

      await tx.customerMembership.deleteMany({
        where: { idUser: { in: userIds } },
      });

      await tx.profile.deleteMany({
        where: { idUser: { in: userIds } },
      });

      await tx.user.deleteMany({
        where: {
          idUser: { in: userIds },
          status: GenericStatus.deleted,
          editAt: { lte: thirtyDaysAgo },
        },
      });
    });

    this.logger.log(
      `CRON: Permanently purged ${userIds.length} ghost users`,
    );
  }
}
