import { plainToInstance } from 'class-transformer';
import { ClientMetricsResponseDto } from '../dto/client-metrics-response.dto';
import type { LatestClientMetricDto } from '../dto/latest-client-metric.dto';
import type { MetricFieldDto } from '../dto/metric-field.dto';

export interface ClientMetricsResponseRecord {
  unit_system: string;
  fields: MetricFieldDto[];
  latest: LatestClientMetricDto | null;
}

export function toClientMetricsResponse(
  record: ClientMetricsResponseRecord,
): ClientMetricsResponseDto {
  return plainToInstance(ClientMetricsResponseDto, record, {
    excludeExtraneousValues: true,
  });
}
