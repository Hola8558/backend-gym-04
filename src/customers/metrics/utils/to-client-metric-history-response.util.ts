import { plainToInstance } from 'class-transformer';
import { ClientMetricHistoryResponseDto } from '../dto/client-metric-history-response.dto';
import type { LatestClientMetricDto } from '../dto/latest-client-metric.dto';

export function toClientMetricHistoryResponse(
  entries: LatestClientMetricDto[],
): ClientMetricHistoryResponseDto {
  return plainToInstance(
    ClientMetricHistoryResponseDto,
    { entries },
    { excludeExtraneousValues: true },
  );
}
