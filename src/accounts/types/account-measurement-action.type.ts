export const ACCOUNT_MEASUREMENT_PLAN_ERRORS = [
  'METRIC_NAME_REQUIRED',
  'METRIC_NAME_TOO_LONG',
  'METRIC_NAME_TAKEN',
  'METRIC_NAME_RESERVED',
  'METRIC_NOT_FOUND',
  'METRIC_UNIT_REQUIRED',
] as const;

export type AccountMeasurementPlanError =
  (typeof ACCOUNT_MEASUREMENT_PLAN_ERRORS)[number];

export interface AccountMeasurementActionInput {
  action: 'add' | 'rename' | 'delete' | 'restore';
  key: string;
  label: string;
  unitType: unknown;
  deletedAt: string;
}
