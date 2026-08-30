import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GenericStatus } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';

/**
 * Cross-tenant background job: marks customer memberships inactive when end_date is in the past.
 */
@Injectable()
export class MembershipCronService {
  private readonly logger = new Logger(MembershipCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredMemberships(): Promise<void> {
    const count = await this.expireStaleMemberships();
    this.logger.log(`CRON: Successfully expired ${count} memberships`);
  }

  /**
   * Dev/test: set MEMBERSHIP_CRON_EVERY_MINUTE=true to run the same logic every minute.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredMembershipsTestPlaceholder(): Promise<void> {
    if (this.config.get<string>('MEMBERSHIP_CRON_EVERY_MINUTE') !== 'true') {
      return;
    }
    const count = await this.expireStaleMemberships();
    this.logger.log(`CRON (test): Successfully expired ${count} memberships`);
  }

  private async expireStaleMemberships(): Promise<number> {
    const now = new Date();
    const result = await this.prisma.customerMembership.updateMany({
      where: {
        status: GenericStatus.active,
        endDate: { lt: now },
        account: { status: { not: GenericStatus.deleted } },
      },
      data: { status: GenericStatus.inactive },
    });
    return result.count;
  }
}
