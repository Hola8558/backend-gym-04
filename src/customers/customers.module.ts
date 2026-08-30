import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { MembershipAuditModule } from '../membership-audit/membership-audit.module';
import { RoutinesModule } from '../routines/routines.module';
import { UsersModule } from '../users/users.module';
import { CustomersDeletedController } from './customers-deleted.controller';
import { CustomersController } from './customers.controller';
import { CustomersImportService } from './customers-import.service';
import { CustomersService } from './customers.service';

@Module({
  imports: [
    UsersModule,
    MembershipAuditModule,
    AuthModule,
    RoutinesModule,
  ],
  controllers: [CustomersController, CustomersDeletedController],
  providers: [CustomersService, CustomersImportService, RolesGuard],
  exports: [CustomersService],
})
export class CustomersModule {}
