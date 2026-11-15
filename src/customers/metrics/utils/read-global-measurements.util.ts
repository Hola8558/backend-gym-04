import { activeAccountMeasurements } from '../../../accounts/utils/account-measurements.util';
import type { GlobalMeasurementDefinition } from '../../../accounts/types/global-measurement.type';

/** Active catalog only. Soft-deleted measurements stay stored and are hidden here. */
export function readGlobalMeasurements(value: unknown): GlobalMeasurementDefinition[] {
  return activeAccountMeasurements(value);
}
