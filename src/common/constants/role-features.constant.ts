import { UserRole } from '@prisma/client';

export const ROLE_FEATURE_MAP: Record<UserRole, string[]> = {
  [UserRole.owner]: ['SETUP_OWNER', 'COACH_SESSIONS_CREATION', 'ENTRY_LOGS'],
  [UserRole.coach]: ['ENTRY_LOGS_COACH'],
  [UserRole.customer]: [],
};
