import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601 } from 'class-validator';

/** Client-local day boundaries (ISO 8601), so "the day" matches the gym's timezone. */
export class UnmarkAttendanceDayQueryDto {
  @ApiProperty({ example: '2026-10-03T06:00:00.000Z', description: 'Day start (inclusive)' })
  @IsISO8601({ strict: true })
  from: string;

  @ApiProperty({ example: '2026-10-04T06:00:00.000Z', description: 'Day end (exclusive)' })
  @IsISO8601({ strict: true })
  to: string;
}
