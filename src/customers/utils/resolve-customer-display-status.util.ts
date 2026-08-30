import { GenericStatus } from '@prisma/client';
import {
  type CustomerMembershipValidityInput,
  isValidCustomerMembershipToday,
} from './is-valid-customer-membership.util';

/**
 * Merges user lifecycle status with membership validity for gym / membership-managed accounts.
 * Deleted and banned users keep their lifecycle status; active users derive active/expired from membership.
 */
export function resolveCustomerDisplayStatus(
  userStatus: GenericStatus,
  membership: CustomerMembershipValidityInput,
  usesMembershipManagedStatus: boolean,
): GenericStatus {
  if (!usesMembershipManagedStatus) {
    return userStatus;
  }

  if (
    userStatus === GenericStatus.deleted ||
    userStatus === GenericStatus.banned
  ) {
    return userStatus;
  }

  if (userStatus !== GenericStatus.active) {
    return GenericStatus.inactive;
  }

  return isValidCustomerMembershipToday(membership)
    ? GenericStatus.active
    : GenericStatus.inactive;
}
