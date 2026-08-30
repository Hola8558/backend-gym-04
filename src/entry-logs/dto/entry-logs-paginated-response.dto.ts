import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Expose } from 'class-transformer';
import { EntryLogHistoryRowDto } from './entry-log-history-row.dto';

export class EntryLogsPaginatedResponseDto {
  @Expose()
  @ApiProperty({ type: [EntryLogHistoryRowDto] })
  @Type(() => EntryLogHistoryRowDto)
  data: EntryLogHistoryRowDto[];

  @Expose()
  @ApiProperty()
  total: number;
}
