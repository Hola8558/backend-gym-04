import type { AccountMeasurement } from '../../accounts/types/account-measurement.type';
import { AccountMeasurementItemDto } from '../dto/account-measurement-item.dto';
import { AccountMeasurementsResponseDto } from '../dto/account-measurements-response.dto';

export function toAccountMeasurementsResponseDto(
  measurements: readonly AccountMeasurement[],
): AccountMeasurementsResponseDto {
  return Object.assign(new AccountMeasurementsResponseDto(), {
    measurements: measurements.map((item) =>
      Object.assign(new AccountMeasurementItemDto(), {
        key: item.key,
        label: item.label,
        unit_type: item.unit_type,
        deleted_at: item.deleted_at,
      }),
    ),
  });
}
