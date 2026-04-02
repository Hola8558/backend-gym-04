import { Module } from '@nestjs/common';
import { SharedUsersService } from './shared-users.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, SharedUsersService],
  exports: [SharedUsersService],
})
export class UsersModule {}
