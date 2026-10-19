import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { TasksModule } from '../tasks/tasks.module';
import { AccessController } from './access.controller';
import { AccessService } from './access.service';
import { EntryLogsAttendanceService } from './entry-logs-attendance.service';
import { EntryLogsKioskController } from './entry-logs-kiosk.controller';
import { EntryLogsKioskService } from './entry-logs-kiosk.service';
import { EntryLogsController } from './entry-logs.controller';
import { EntryLogsService } from './entry-logs.service';

@Module({
  imports: [TasksModule],
  controllers: [EntryLogsController, EntryLogsKioskController, AccessController],
  providers: [
    EntryLogsService,
    EntryLogsKioskService,
    EntryLogsAttendanceService,
    AccessService,
    RolesGuard,
  ],
  exports: [EntryLogsService, AccessService],
})
export class EntryLogsModule {}
