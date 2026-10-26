import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { LatestClientMetricDto } from './latest-client-metric.dto';
import { MetricFieldDto } from './metric-field.dto';

export class ClientMetricsResponseDto {
  @Expose()
  @ApiProperty({ example: 'metric', enum: ['metric', 'imperial'] })
  unit_system: string;

  @Expose()
  @Type(() => MetricFieldDto)
  @ApiProperty({ type: MetricFieldDto, isArray: true })
  fields: MetricFieldDto[];

  @Expose()
  @Type(() => LatestClientMetricDto)
  @ApiProperty({ type: LatestClientMetricDto, nullable: true })
  latest: LatestClientMetricDto | null;
}
