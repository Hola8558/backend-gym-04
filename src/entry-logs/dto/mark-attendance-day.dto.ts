import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601 } from 'class-validator';

export class MarkAttendanceDayDto {
  @ApiProperty({
    description: 'Instant inside the day to mark (ISO 8601); must be within the retention window',
    example: '2026-10-03T18:00:00.000Z',
  })
  @IsISO8601({ strict: true })
  entry_date: string;
}
