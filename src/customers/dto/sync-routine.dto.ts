import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, Min } from 'class-validator';

export class SyncRoutineDto {
  @ApiProperty({ description: 'Routine primary key from login payload' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_routine!: number;

  @ApiProperty({
    description: 'Client last-known edited_at (ISO 8601)',
    example: '2026-05-28T12:00:00.000Z',
  })
  @IsDateString()
  client_edited_at!: string;
}
