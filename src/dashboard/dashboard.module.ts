import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [CustomersModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
