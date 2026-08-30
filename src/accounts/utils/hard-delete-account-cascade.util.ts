import type { Prisma } from '@prisma/client';

export async function hardDeleteAccountCascade(
  tx: Prisma.TransactionClient,
  idAccount: number,
): Promise<void> {
  const userFilter = { user: { idAccount } };

  await tx.membershipHistory.deleteMany({ where: { idAccount } });
  await tx.customerMembership.deleteMany({ where: { idAccount } });
  await tx.media.deleteMany({ where: { category: { idAccount } } });
  await tx.category.deleteMany({ where: { idAccount } });
  await tx.customerMenu.deleteMany({ where: userFilter });
  await tx.featureFlag.deleteMany({ where: userFilter });
  await tx.customerBan.deleteMany({ where: { idAccount } });
  await tx.entryLog.deleteMany({ where: { idAccount } });
  await tx.routine.deleteMany({ where: { idAccount } });
  await tx.membershipType.deleteMany({ where: { idAccount } });
  await tx.exerciseFav.deleteMany({ where: { idAccount } });
  await tx.crowdmeter.deleteMany({ where: { id_account: idAccount } });
  await tx.activityLog.deleteMany({ where: { id_account: idAccount } });
  await tx.originalNewIngredient.deleteMany({ where: { idAccount } });
  await tx.recipe.deleteMany({ where: { idAccount } });

  await tx.profile.updateMany({
    where: { user: { idAccount } },
    data: { idCoach: null },
  });
  await tx.profile.deleteMany({ where: userFilter });

  await tx.user.updateMany({
    where: { idAccount },
    data: { deletedById: null },
  });
  await tx.user.deleteMany({ where: { idAccount } });

  await tx.accountDetail.deleteMany({ where: { idAccount } });
  await tx.account.delete({ where: { idAccount } });
}
