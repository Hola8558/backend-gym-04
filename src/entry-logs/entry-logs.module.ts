import { Module } from '@nestjs/common';
import { EntryLogsService } from './entry-logs.service';

@Module({
  providers: [EntryLogsService],
  exports: [EntryLogsService],
})
export class EntryLogsModule {}
