import { UserRole } from '@prisma/client';

/** Feature id: entry logs / access (matches `features` table and JWT feature flags). */
export const DASHBOARD_FEATURE_ENTRY_LOGS = 5001;

/** Feature id: membership management for solo coach accounts. */
export const DASHBOARD_FEATURE_MEMBERSHIP_MANAGEMENT = 5006;

export type DashboardMetricsGates = {
  canViewMemberships: boolean;
  canViewAccess: boolean;
};

/**
 * RBAC + feature flags for dashboard metrics slices.
 * Solo coach is determined by `UserRole.solo_coach` (aligned with account bootstrap and JWT).
 */
export function evaluateDashboardMetricsGates(
  userRole: UserRole,
  enabledFeatureIds: readonly number[],
): DashboardMetricsGates {
  const idSet = new Set(enabledFeatureIds);
  const isSoloCoach = userRole === UserRole.solo_coach;
  const hasFeature5006 = idSet.has(DASHBOARD_FEATURE_MEMBERSHIP_MANAGEMENT);
  const hasFeature5001 = idSet.has(DASHBOARD_FEATURE_ENTRY_LOGS);
  return {
    canViewMemberships: !isSoloCoach || (isSoloCoach && hasFeature5006),
    canViewAccess: !isSoloCoach && hasFeature5001,
  };
}
