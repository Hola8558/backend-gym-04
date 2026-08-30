import { GenericStatus, Prisma, UserRole } from '@prisma/client';
import type { PrismaService } from '../../core/prisma/prisma.service';
import type { ForgotPasswordLookup } from '../types/forgot-password-lookup.type';
import type { PasswordResetUser } from '../types/password-reset-user.type';

/** All roles stored in the shared `users` table that may reset a password. */
export const PASSWORD_RESET_ELIGIBLE_ROLES: UserRole[] = [
  UserRole.owner,
  UserRole.coach,
  UserRole.solo_coach,
  UserRole.customer,
];

const passwordResetUserInclude = {
  account: { select: { name: true } },
  profile: { select: { name: true, lastName: true } },
} satisfies Prisma.UserInclude;

const nonDeletedRoleFilter = {
  status: { not: GenericStatus.deleted },
  role: { in: PASSWORD_RESET_ELIGIBLE_ROLES },
} satisfies Prisma.UserWhereInput;

type PasswordResetQueryClient = Pick<PrismaService, 'user'>;

export async function findUserForPasswordReset(
  prisma: PasswordResetQueryClient,
  lookup: ForgotPasswordLookup,
): Promise<PasswordResetUser | null> {
  const searchNumber = lookup.userNumber?.trim();
  const searchIdentifier = lookup.identifier?.trim();

  if (searchNumber) {
    return findByUserNumber(prisma, searchNumber);
  }

  if (searchIdentifier) {
    if (searchIdentifier.includes('@')) {
      return findByEmail(prisma, searchIdentifier);
    }

    return findByUserNumber(prisma, searchIdentifier);
  }

  console.log(
    '--- DIAGNOSTIC 3a (NEST): NO identifier OR userNumber PROVIDED TO LOOKUP ---',
  );
  return null;
}

async function findByEmail(
  prisma: PasswordResetQueryClient,
  email: string,
): Promise<PasswordResetUser | null> {
  const where: Prisma.UserWhereInput = {
    email: {
      equals: email,
      mode: 'insensitive',
    },
    ...nonDeletedRoleFilter,
  };

  console.log(
    `--- DIAGNOSTIC 3b (NEST): QUERY TABLE=users (email, case-insensitive) WHERE = ${JSON.stringify(where)} ---`,
  );

  const users = (await prisma.user.findMany({
    where,
    include: passwordResetUserInclude,
    orderBy: { idUser: 'asc' },
  })) as PasswordResetUser[];

  logMatchSummary(users);

  const picked = pickPasswordResetCandidate(users);
  if (users.length > 1 && !picked) {
    console.log(
      '--- DIAGNOSTIC 3e (NEST): AMBIGUOUS EMAIL (multiple non-deleted users, not exactly one active). Returning null. ---',
    );
  }

  return picked;
}

async function findByUserNumber(
  prisma: PasswordResetQueryClient,
  userNumber: string,
): Promise<PasswordResetUser | null> {
  const where: Prisma.UserWhereInput = {
    userNumber,
    ...nonDeletedRoleFilter,
  };

  console.log(
    `--- DIAGNOSTIC 3b (NEST): QUERY TABLE=users (userNumber) WHERE = ${JSON.stringify(where)} ---`,
  );

  const user = (await prisma.user.findFirst({
    where,
    include: passwordResetUserInclude,
  })) as PasswordResetUser | null;

  console.log(
    `--- DIAGNOSTIC 3c (NEST): users TABLE MATCH = ${user ? JSON.stringify({ idUser: user.idUser, email: user.email, role: user.role, status: user.status }) : 'null'} ---`,
  );

  return user;
}

function logMatchSummary(users: PasswordResetUser[]): void {
  console.log(
    `--- DIAGNOSTIC 3c (NEST): users TABLE MATCH COUNT = ${users.length} ---`,
  );
  if (users.length > 0) {
    console.log(
      `--- DIAGNOSTIC 3d (NEST): MATCHES = ${JSON.stringify(
        users.map((user) => ({
          idUser: user.idUser,
          idAccount: user.idAccount,
          email: user.email,
          role: user.role,
          status: user.status,
        })),
      )} ---`,
    );
  }
}

function pickPasswordResetCandidate(
  users: PasswordResetUser[],
): PasswordResetUser | null {
  if (users.length === 0) {
    return null;
  }

  if (users.length === 1) {
    return users[0];
  }

  const active = users.filter((user) => user.status === GenericStatus.active);
  if (active.length === 1) {
    return active[0];
  }

  return null;
}
