import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { AccessController } from './access.controller';
import { AccessService } from './access.service';
import { EntryLogsController } from './entry-logs.controller';
import { EntryLogsService } from './entry-logs.service';

@Module({
  controllers: [EntryLogsController, AccessController],
  providers: [EntryLogsService, AccessService, RolesGuard],
  exports: [EntryLogsService, AccessService],
})
export class EntryLogsModule {}
