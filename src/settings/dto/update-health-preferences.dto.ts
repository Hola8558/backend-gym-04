import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { HEALTH_PREFERENCE_NAME_MAX } from '../utils/health-preference-lists.util';

export const HEALTH_PREFERENCE_ACTIONS = [
  'add',
  'rename',
  'delete',
  'restore',
] as const;

export type HealthPreferenceAction = (typeof HEALTH_PREFERENCE_ACTIONS)[number];

export class UpdateHealthPreferencesDto {
  @ApiProperty({ enum: HEALTH_PREFERENCE_ACTIONS })
  @IsIn(HEALTH_PREFERENCE_ACTIONS)
  action!: HealthPreferenceAction;

  @ApiProperty({ example: 'alergias' })
  @IsString()
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({ example: 'Alergias alimentarias' })
  @IsOptional()
  @IsString()
  @MaxLength(HEALTH_PREFERENCE_NAME_MAX)
  next_name?: string;
}
