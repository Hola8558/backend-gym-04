import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TasksModule } from '../tasks/tasks.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { MembershipAuditModule } from '../membership-audit/membership-audit.module';
import { RoutinesModule } from '../routines/routines.module';
import { UsersModule } from '../users/users.module';
import { CustomersDeletedController } from './customers-deleted.controller';
import { CustomersController } from './customers.controller';
import { CustomersImportService } from './customers-import.service';
import { CustomersMetricsCatalogController } from './metrics/customers-metrics-catalog.controller';
import { CustomersMetricsController } from './metrics/customers-metrics.controller';
import { CustomersMetricsService } from './metrics/customers-metrics.service';
import { CustomersService } from './customers.service';

@Module({
  imports: [
    UsersModule,
    MembershipAuditModule,
    AuthModule,
    RoutinesModule,
    TasksModule,
  ],
  controllers: [
    CustomersController,
    CustomersDeletedController,
    CustomersMetricsCatalogController,
    CustomersMetricsController,
  ],
  providers: [
    CustomersService,
    CustomersImportService,
    CustomersMetricsService,
    RolesGuard,
  ],
  exports: [CustomersService],
})
export class CustomersModule {}
