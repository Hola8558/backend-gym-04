import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { GLOBAL_MEASUREMENT_UNIT_TYPES } from '../../accounts/types/global-measurement.type';

export const ACCOUNT_MEASUREMENT_ACTIONS = [
  'add',
  'rename',
  'delete',
  'restore',
] as const;

export type AccountMeasurementActionName =
  (typeof ACCOUNT_MEASUREMENT_ACTIONS)[number];

export class UpdateAccountMeasurementsDto {
  @ApiProperty({ enum: ACCOUNT_MEASUREMENT_ACTIONS })
  @IsIn(ACCOUNT_MEASUREMENT_ACTIONS)
  action!: AccountMeasurementActionName;

  @ApiPropertyOptional({ example: 'pecho' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  key?: string;

  @ApiPropertyOptional({ example: 'Tórax' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;

  @ApiPropertyOptional({ enum: GLOBAL_MEASUREMENT_UNIT_TYPES, example: 'length' })
  @IsOptional()
  @IsIn(GLOBAL_MEASUREMENT_UNIT_TYPES)
  unit_type?: (typeof GLOBAL_MEASUREMENT_UNIT_TYPES)[number];
}
