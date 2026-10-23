import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { TasksModule } from '../tasks/tasks.module';
import { DashboardController } from './dashboard.controller';
import { DashboardMetricsExportService } from './dashboard-metrics-export.service';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [CustomersModule, TasksModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardMetricsExportService],
})
export class DashboardModule {}
