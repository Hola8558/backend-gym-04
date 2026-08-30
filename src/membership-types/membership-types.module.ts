import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { MembershipTypesController } from './membership-types.controller';
import { MembershipTypesService } from './membership-types.service';

@Module({
  controllers: [MembershipTypesController],
  providers: [MembershipTypesService, RolesGuard],
  exports: [MembershipTypesService],
})
export class MembershipTypesModule {}
