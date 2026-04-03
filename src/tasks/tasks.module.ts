import { Module } from '@nestjs/common';
import { EntryLogsCronService } from './entry-logs-cron.service';
import { MembershipCronService } from './membership-cron.service';

@Module({
  providers: [MembershipCronService, EntryLogsCronService],
})
export class TasksModule {}
