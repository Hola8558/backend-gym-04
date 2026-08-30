import { Module } from '@nestjs/common';
import { CustomersPersonalInfoController } from './customers-personal-info.controller';
import { CustomersPersonalInfoService } from './customers-personal-info.service';

@Module({
  controllers: [CustomersPersonalInfoController],
  providers: [CustomersPersonalInfoService],
})
export class CustomersPersonalInfoModule {}
