export const GLOBAL_MEASUREMENT_UNIT_TYPES = ['length', 'percentage'] as const;

export type GlobalMeasurementUnitType = (typeof GLOBAL_MEASUREMENT_UNIT_TYPES)[number];

export interface GlobalMeasurementDefinition {
  key: string;
  label: string;
  unit_type: GlobalMeasurementUnitType;
}
