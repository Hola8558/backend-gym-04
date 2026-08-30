import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CustomerAccessLogItemDto {
  @Expose()
  @ApiProperty()
  idEntryLog: number;

  @Expose()
  @ApiProperty()
  entryDate: Date;
}
