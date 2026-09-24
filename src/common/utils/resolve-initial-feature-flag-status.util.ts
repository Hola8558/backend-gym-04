import { GenericStatus } from '@prisma/client';

/**
 * Initial feature_flag status when provisioning a user.
 * Customizable features start inactive; non-customizable start active.
 */
export function resolveInitialFeatureFlagStatus(
  customizable: boolean,
): GenericStatus {
  return customizable ? GenericStatus.inactive : GenericStatus.active;
}
