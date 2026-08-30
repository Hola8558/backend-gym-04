import { Module } from '@nestjs/common';
import { MembershipAuditModule } from '../membership-audit/membership-audit.module';
import { CustomerMembershipsController } from './customer-memberships.controller';
import { CustomerMembershipsService } from './customer-memberships.service';

@Module({
  imports: [MembershipAuditModule],
  controllers: [CustomerMembershipsController],
  providers: [CustomerMembershipsService],
})
export class CustomerMembershipsModule {}
