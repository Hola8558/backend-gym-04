import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { MembershipTypesModule } from '../membership-types/membership-types.module';
import { MembershipsController } from './memberships.controller';

@Module({
  imports: [MembershipTypesModule],
  controllers: [MembershipsController],
  providers: [RolesGuard],
})
export class MembershipsModule {}
