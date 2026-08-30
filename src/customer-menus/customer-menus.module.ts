import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { CustomerMenusController } from './customer-menus.controller';
import { CustomerMenusService } from './customer-menus.service';

@Module({
  controllers: [CustomerMenusController],
  providers: [CustomerMenusService, RolesGuard],
  exports: [CustomerMenusService],
})
export class CustomerMenusModule {}
