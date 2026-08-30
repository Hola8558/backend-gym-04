import { Prisma } from '@prisma/client';

import { DELEGATABLE_COACH_FEATURE_IDS } from '../constants/delegatable-coach-feature-ids.const';

export const coachUserPublicSelect = {
  idUser: true,
  idAccount: true,
  branch: true,
  userNumber: true,
  email: true,
  role: true,
  editAt: true,
  status: true,
  profile: true,
  featureFlags: {
    where: { idFeature: { in: [...DELEGATABLE_COACH_FEATURE_IDS] } },
    select: { idFeature: true, status: true },
  },
} as const satisfies Prisma.UserSelect;

export const deletedCoachListSelect = {
  ...coachUserPublicSelect,
  deletedBy: {
    select: {
      idUser: true,
      profile: { select: { name: true, lastName: true } },
    },
  },
} as const satisfies Prisma.UserSelect;

export type DeletedCoachListRow = Prisma.UserGetPayload<{
  select: typeof deletedCoachListSelect;
}>;

function formatDeletedByName(
  deletedBy: DeletedCoachListRow['deletedBy'],
): string | null {
  if (!deletedBy?.profile) {
    return null;
  }
  const parts = [deletedBy.profile.name, deletedBy.profile.lastName]
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map((x) => x.trim());
  return parts.length > 0 ? parts.join(' ') : null;
}

export function mapDeletedCoachListRow(row: DeletedCoachListRow) {
  return {
    idUser: row.idUser,
    idAccount: row.idAccount,
    branch: row.branch,
    userNumber: row.userNumber,
    email: row.email,
    role: row.role,
    editAt: row.editAt,
    status: row.status,
    profile: row.profile,
    deleted_at: row.editAt.toISOString(),
    deletedBy: formatDeletedByName(row.deletedBy),
  };
}
