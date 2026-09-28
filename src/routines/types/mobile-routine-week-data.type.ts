import type { MobileRoutineItem } from './mobile-routine-item.type';
import type { RoutineWeekDayKey } from './routine-week-day-key.type';

/** `null` = day not planned, `[]` = planned but empty. */
export type MobileRoutineWeekData = { week: number } & Record<
  RoutineWeekDayKey,
  MobileRoutineItem[] | null
>;
