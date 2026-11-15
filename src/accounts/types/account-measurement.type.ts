import type { GlobalMeasurementUnitType } from './global-measurement.type';

/** One body-measurement definition stored in account_details.global_measurements. */
export interface AccountMeasurement {
  key: string;
  label: string;
  unit_type: GlobalMeasurementUnitType;
  deleted_at: string | null;
}
