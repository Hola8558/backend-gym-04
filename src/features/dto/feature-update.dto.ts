import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class FeatureUpdate {
  @ApiProperty({ description: 'Feature id (id_feature as string)' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'true → active, false → inactive' })
  @IsBoolean()
  value!: boolean;
}
