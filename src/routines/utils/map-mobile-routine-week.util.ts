import type { ExerciseCatalogFields } from '../../exercises/types/exercise-catalog-fields.type';
import { ROUTINE_WEEK_DAY_KEYS } from '../constants/routine-week-day-keys.const';
import type { MobileRoutineItem } from '../types/mobile-routine-item.type';
import type { MobileRoutineWeekData } from '../types/mobile-routine-week-data.type';
import { asJsonRecord } from './as-json-record.util';
import { mapMobileRoutineItem } from './map-mobile-routine-item.util';
import { sortRoutineRows } from './sort-routine-rows.util';

/** Stored week JSON -> mobile week (`week` + Lun..Dom only; coach metadata is dropped). */
export function mapMobileRoutineWeek(
  rawWeek: unknown,
  catalogById: ReadonlyMap<number, ExerciseCatalogFields>,
): MobileRoutineWeekData {
  const week = asJsonRecord(rawWeek) ?? {};
  const out = {
    week: typeof week.week === 'number' ? week.week : 1,
  } as MobileRoutineWeekData;

  for (const day of ROUTINE_WEEK_DAY_KEYS) {
    const rows = week[day];
    out[day] = Array.isArray(rows)
      ? sortRoutineRows(rows)
          .map((row) => mapMobileRoutineItem(row, catalogById))
          .filter((item): item is MobileRoutineItem => item !== null)
      : null;
  }

  return out;
}
