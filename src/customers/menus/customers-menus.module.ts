import { Module } from '@nestjs/common';
import { CustomersMenusController } from './customers-menus.controller';
import { CustomersMenusService } from './customers-menus.service';

@Module({
  controllers: [CustomersMenusController],
  providers: [CustomersMenusService],
  exports: [CustomersMenusService],
})
export class CustomersMenusModule {}
