import { ENTRY_LOG_RETENTION_DAYS } from '../../common/constants/entry-log-retention-days.const';
import { subUtcDays } from '../../common/utils/utc-date.util';
import { ATTENDANCE_CLOCK_SKEW_MS } from '../constants/attendance-day.const';

/** True when `date` is inside the editable attendance window: (now − retention, now + skew]. */
export function isWithinEntryLogRetention(date: Date, now: Date = new Date()): boolean {
  const windowStart = subUtcDays(now, ENTRY_LOG_RETENTION_DAYS);
  return (
    date.getTime() >= windowStart.getTime() &&
    date.getTime() <= now.getTime() + ATTENDANCE_CLOCK_SKEW_MS
  );
}
