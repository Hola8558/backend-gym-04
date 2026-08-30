import { startOfUtcDay } from '../../common/utils/utc-date.util';

/** Normalize @db.Date membership bounds to UTC midnight for audit timestamps. */
export function membershipRowDatesToAudit(
  startDate: Date,
  endDate: Date | null,
): { startDate: Date; endDate: Date } {
  const start = startOfUtcDay(new Date(startDate));
  const end = endDate != null ? startOfUtcDay(new Date(endDate)) : start;
  return { startDate: start, endDate: end };
}
