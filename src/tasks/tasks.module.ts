import { Module } from '@nestjs/common';
import { AccountsCronService } from './accounts-cron.service';
import { EntryLogsCronService } from './entry-logs-cron.service';
import { MembershipCronService } from './membership-cron.service';
import { UsersCronService } from './users-cron.service';

@Module({
  providers: [
    MembershipCronService,
    EntryLogsCronService,
    UsersCronService,
    AccountsCronService,
  ],
  exports: [EntryLogsCronService],
})
export class TasksModule {}
