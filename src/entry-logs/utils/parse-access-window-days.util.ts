import {
  ENTRY_LOG_EDIT_WINDOW_DAYS,
  ENTRY_LOG_RETENTION_DAYS,
} from '../../common/constants/entry-log-retention-days.const';

/** Missing or invalid values stay on the calendar window. Never wider than retention. */
export function parseAccessWindowDays(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!raw || !Number.isInteger(parsed)) {
    return ENTRY_LOG_EDIT_WINDOW_DAYS;
  }
  return Math.min(ENTRY_LOG_RETENTION_DAYS, Math.max(1, parsed));
}
