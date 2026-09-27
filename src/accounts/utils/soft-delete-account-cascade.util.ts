import { BanStatus, GenericStatus, Prisma } from '@prisma/client';

/**
 * Soft-deletes a tenant account and all related rows that carry a status field.
 * Junction / log tables without status stay until the permanent purge cron;
 * login and reads already ignore soft-deleted parents.
 */
export async function softDeleteAccountCascade(
  tx: Prisma.TransactionClient,
  idAccount: number,
): Promise<void> {
  const userFilter = { user: { idAccount } };

  await tx.media.updateMany({
    where: { category: { idAccount } },
    data: { status: GenericStatus.deleted },
  });

  await tx.category.updateMany({
    where: { idAccount },
    data: { status: GenericStatus.deleted },
  });

  await tx.customerMenu.updateMany({
    where: userFilter,
    data: { status: GenericStatus.deleted },
  });

  await tx.featureFlag.updateMany({
    where: userFilter,
    data: { status: GenericStatus.deleted },
  });

  await tx.customerBan.updateMany({
    where: { idAccount, status: BanStatus.ACTIVE },
    data: { status: BanStatus.INACTIVE },
  });

  await tx.entryLog.updateMany({
    where: { idAccount },
    data: { status: GenericStatus.deleted },
  });

  await tx.routine.updateMany({
    where: { idAccount },
    data: { status: GenericStatus.deleted },
  });

  await tx.customerMembership.updateMany({
    where: { idAccount },
    data: { status: GenericStatus.deleted },
  });

  await tx.membershipType.updateMany({
    where: { idAccount },
    data: { status: GenericStatus.deleted },
  });

  // Break coach↔customer links inside the tenant before soft-deleting profiles.
  await tx.profile.updateMany({
    where: { user: { idAccount } },
    data: { idCoach: null },
  });

  await tx.profile.updateMany({
    where: userFilter,
    data: { status: GenericStatus.deleted },
  });

  await tx.user.updateMany({
    where: { idAccount },
    data: { status: GenericStatus.deleted },
  });

  await tx.account.update({
    where: { idAccount },
    data: { status: GenericStatus.deleted },
  });
}
