import { Module } from '@nestjs/common';
import { MembershipAuditService } from './membership-audit.service';

@Module({
  providers: [MembershipAuditService],
  exports: [MembershipAuditService],
})
export class MembershipAuditModule {}
