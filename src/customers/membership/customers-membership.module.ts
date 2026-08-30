import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CustomersMembershipController } from './customers-membership.controller';
import { CustomersMembershipService } from './customers-membership.service';

@Module({
  controllers: [CustomersMembershipController],
  providers: [CustomersMembershipService, RolesGuard],
})
export class CustomersMembershipModule {}
