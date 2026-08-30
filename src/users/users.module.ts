import { Module } from '@nestjs/common';
import { MembershipAuditModule } from '../membership-audit/membership-audit.module';
import { SharedUsersService } from './shared-users.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [MembershipAuditModule],
  controllers: [UsersController],
  providers: [UsersService, SharedUsersService],
  exports: [SharedUsersService, UsersService],
})
export class UsersModule {}
