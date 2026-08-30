import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MobileRoutineItemDto } from './mobile-routine-item.dto';

export class SyncRoutineResponseDto {
  @ApiProperty()
  isUpToDate!: boolean;

  @ApiPropertyOptional({
    type: MobileRoutineItemDto,
    description: 'Present when isUpToDate is false and server has a newer revision',
  })
  routine?: MobileRoutineItemDto;
}
