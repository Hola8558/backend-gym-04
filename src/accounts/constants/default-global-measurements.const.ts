import type { GlobalMeasurementDefinition } from '../types/global-measurement.type';

/** Starter catalog stored on account_details.global_measurements when an account is created. */
export const DEFAULT_GLOBAL_MEASUREMENTS: readonly GlobalMeasurementDefinition[] = [
  { key: 'estatura', label: 'Estatura', unit_type: 'length' },
  { key: 'cuello', label: 'Cuello', unit_type: 'length' },
  { key: 'hombros', label: 'Hombros', unit_type: 'length' },
  { key: 'pecho', label: 'Pecho', unit_type: 'length' },
  { key: 'biceps', label: 'Bíceps', unit_type: 'length' },
  { key: 'antebrazo', label: 'Antebrazo', unit_type: 'length' },
  { key: 'cintura', label: 'Cintura', unit_type: 'length' },
  { key: 'abdomen', label: 'Abdomen', unit_type: 'length' },
  { key: 'cadera', label: 'Cadera', unit_type: 'length' },
  { key: 'gluteo', label: 'Glúteo', unit_type: 'length' },
  { key: 'muslo', label: 'Muslo', unit_type: 'length' },
  { key: 'pantorrilla', label: 'Pantorrilla', unit_type: 'length' },
  { key: 'grasa_corporal', label: '% Grasa Corporal', unit_type: 'percentage' },
];
