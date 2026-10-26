export const METRIC_FIELD_UNIT_TYPES = ['weight', 'length', 'percentage'] as const;

export type MetricFieldUnitType = (typeof METRIC_FIELD_UNIT_TYPES)[number];

export const WEIGHT_METRIC_KEY = 'weight';

export interface MetricFieldDefinition {
  key: string;
  label: string;
  unit_type: MetricFieldUnitType;
  unit: string;
}
