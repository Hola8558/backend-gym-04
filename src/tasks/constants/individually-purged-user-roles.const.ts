import { UserRole } from '@prisma/client';

/** Roles the user-purge cron may hard-delete. Owner / solo_coach follow the account. */
export const INDIVIDUALLY_PURGED_USER_ROLES: UserRole[] = [
  UserRole.customer,
  UserRole.coach,
];
