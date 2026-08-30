import { BanStatus, GenericStatus, Prisma } from '@prisma/client';

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
