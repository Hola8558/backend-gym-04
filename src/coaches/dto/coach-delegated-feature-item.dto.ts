import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt } from 'class-validator';

const DELEGATED_FEATURE_STATUSES = ['active', 'inactive'] as const;

export class CoachDelegatedFeatureItemDto {
  @ApiProperty({ example: 5005 })
  @Type(() => Number)
  @IsInt()
  id_feature!: number;

  @ApiProperty({ enum: DELEGATED_FEATURE_STATUSES })
  @IsIn(DELEGATED_FEATURE_STATUSES)
  status!: (typeof DELEGATED_FEATURE_STATUSES)[number];
}
