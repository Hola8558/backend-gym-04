import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UnmarkAttendanceDayResponseDto {
  @Expose()
  @ApiProperty({ description: 'Entry logs soft-deleted for that day' })
  removed: number;
}
