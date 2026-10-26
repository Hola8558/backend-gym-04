import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { LatestClientMetricDto } from './latest-client-metric.dto';

export class ClientMetricHistoryResponseDto {
  @Expose()
  @Type(() => LatestClientMetricDto)
  @ApiProperty({ type: LatestClientMetricDto, isArray: true })
  entries: LatestClientMetricDto[];
}
