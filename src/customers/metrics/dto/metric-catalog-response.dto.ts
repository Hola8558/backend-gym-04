import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { MetricFieldDto } from './metric-field.dto';

export class MetricCatalogResponseDto {
  @Expose()
  @ApiProperty({ example: 'metric', enum: ['metric', 'imperial'] })
  unit_system: string;

  @Expose()
  @Type(() => MetricFieldDto)
  @ApiProperty({ type: MetricFieldDto, isArray: true })
  fields: MetricFieldDto[];
}
