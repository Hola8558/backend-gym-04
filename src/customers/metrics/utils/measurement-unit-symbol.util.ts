import type { MetricFieldUnitType } from '../types/metric-field.type';

/** Storage unit. Display conversion to lb/in happens in the client. */
export function measurementUnitSymbol(unitType: MetricFieldUnitType): string {
  if (unitType === 'percentage') {
    return '%';
  }
  if (unitType === 'weight') {
    return 'kg';
  }
  return 'cm';
}
