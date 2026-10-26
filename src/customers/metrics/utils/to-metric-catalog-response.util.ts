import { plainToInstance } from 'class-transformer';
import { MetricCatalogResponseDto } from '../dto/metric-catalog-response.dto';
import type { MetricFieldDto } from '../dto/metric-field.dto';

export function toMetricCatalogResponse(record: {
  unit_system: string;
  fields: MetricFieldDto[];
}): MetricCatalogResponseDto {
  return plainToInstance(MetricCatalogResponseDto, record, {
    excludeExtraneousValues: true,
  });
}
