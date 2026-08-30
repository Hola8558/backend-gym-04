import { GenericStatus } from '@prisma/client';
import { startOfUtcDay } from '../../common/utils/utc-date.util';

export type CustomerMembershipValidityInput = {
  status: GenericStatus;
  endDate: Date | null;
} | null;

/** Active membership row that grants access today (UTC). */
export function isValidCustomerMembershipToday(
  membership: CustomerMembershipValidityInput,
  todayStart: Date = startOfUtcDay(new Date()),
): boolean {
  if (!membership || membership.status !== GenericStatus.active) {
    return false;
  }
  if (membership.endDate === null) {
    return true;
  }
  return startOfUtcDay(membership.endDate).getTime() >= todayStart.getTime();
}
