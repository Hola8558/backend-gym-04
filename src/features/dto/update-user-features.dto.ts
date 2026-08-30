import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { FeatureUpdate } from './feature-update.dto';

export class UpdateUserFeaturesDto {
  @ApiProperty({ type: [FeatureUpdate] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureUpdate)
  features!: FeatureUpdate[];
}
