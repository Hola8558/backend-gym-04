import { Module } from '@nestjs/common';
import { CustomerMembershipsController } from './customer-memberships.controller';
import { CustomerMembershipsService } from './customer-memberships.service';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [CustomerMembershipsController],
  providers: [CustomerMembershipsService, RolesGuard],
})
export class CustomerMembershipsModule {}
