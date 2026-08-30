/**
 * Mirrors Prisma `MembershipAction` (schema enum `membership_action`).
 * After `npx prisma generate`, `@prisma/client` will export the same enum.
 */
export const MembershipAction = {
  NEW: 'NEW',
  RENEWAL: 'RENEWAL',
  CHANGE: 'CHANGE',
  CANCELLATION: 'CANCELLATION',
} as const;

export type MembershipAction =
  (typeof MembershipAction)[keyof typeof MembershipAction];
