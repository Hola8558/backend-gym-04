import { ApiPropertyOptional } from '@nestjs/swagger';
import { PickType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { UpdateUserDto } from '../../users/dto/update-user.dto';
import { CoachDelegatedFeatureItemDto } from './coach-delegated-feature-item.dto';

export class UpdateCoachDto extends PickType(UpdateUserDto, [
  'email',
  'name',
  'last_name',
  'phone',
  'emergency_phone',
  'observations',
] as const) {
  @ApiPropertyOptional({
    type: [CoachDelegatedFeatureItemDto],
    description:
      'Optional delegated feature flags for this coach. IDs must belong to the master coach customizable feature catalog; parent `inactive` forces children in the same payload to `inactive`.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CoachDelegatedFeatureItemDto)
  delegated_features?: CoachDelegatedFeatureItemDto[];
}
