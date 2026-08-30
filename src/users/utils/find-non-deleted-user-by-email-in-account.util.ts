import { GenericStatus, Prisma } from '@prisma/client';

type UserFindFirstClient = {
  user: {
    findFirst: (args: Prisma.UserFindFirstArgs) => Promise<{ idUser: number } | null>;
  };
};

/**
 * Returns a non-deleted user in the tenant that already owns the email, if any.
 * Soft-deleted rows are ignored so the same email can be registered again.
 */
export async function findNonDeletedUserByEmailInAccount(
  prisma: UserFindFirstClient,
  idAccount: number,
  email: string,
  excludeUserId?: number,
): Promise<{ idUser: number } | null> {
  const normalized = email.trim();
  if (normalized === '') {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      idAccount,
      email: normalized,
      status: { not: GenericStatus.deleted },
      ...(excludeUserId != null ? { idUser: { not: excludeUserId } } : {}),
    },
    select: { idUser: true },
  });
}
