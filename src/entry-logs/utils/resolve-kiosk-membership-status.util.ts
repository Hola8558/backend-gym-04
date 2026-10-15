import { GenericStatus } from '@prisma/client';
import { startOfUtcDay } from '../../common/utils/utc-date.util';
import type { KioskMembershipStatus } from '../types/kiosk-membership-status.type';

/** Same rule as the customer login turnstile: active and not past its UTC end date. */
export function resolveKioskMembershipStatus(
  membership: { status: GenericStatus; endDate: Date | null } | null,
  now: Date = new Date(),
): KioskMembershipStatus {
  if (!membership) {
    return 'none';
  }
  const notExpired =
    membership.endDate == null || membership.endDate >= startOfUtcDay(now);
  return membership.status === GenericStatus.active && notExpired
    ? 'active'
    : 'expired';
}
