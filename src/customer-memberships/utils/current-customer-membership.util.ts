import { GenericStatus, Prisma } from '@prisma/client';

export type CurrentMembershipSnapshot = {
  idCustomerMembership: number;
  idMembershipType: number;
  status: GenericStatus;
  startDate: Date;
  endDate: Date | null;
};

/** Newest non-deleted row marked as the customer's current membership. */
export function currentCustomerMembershipWhere(
  idAccount?: number,
): Prisma.CustomerMembershipWhereInput {
  return {
    ...(idAccount != null ? { idAccount } : {}),
    isCurrent: true,
    status: { not: GenericStatus.deleted },
  };
}

export const currentCustomerMembershipOrderBy = [
  { createdAt: 'desc' as const },
  { idCustomerMembership: 'desc' as const },
];

export function currentCustomerMembershipRelation<
  T extends Prisma.CustomerMembershipSelect,
>(select: T) {
  return {
    where: currentCustomerMembershipWhere(),
    orderBy: currentCustomerMembershipOrderBy,
    take: 1 as const,
    select,
  };
}

/**
 * Closes the current non-deleted membership and inserts a new current row.
 * The previous row stays in the table so a later soft delete can roll back to it.
 */
export async function openNewCurrentCustomerMembership(
  tx: Prisma.TransactionClient,
  input: {
    idAccount: number;
    idUser: number;
    idMembershipType: number;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
  },
): Promise<{
  created: CurrentMembershipSnapshot;
  previous: CurrentMembershipSnapshot | null;
}> {
  const existing = await tx.customerMembership.findFirst({
    where: {
      ...currentCustomerMembershipWhere(input.idAccount),
      idUser: input.idUser,
    },
    orderBy: currentCustomerMembershipOrderBy,
  });

  if (existing) {
    await tx.customerMembership.update({
      where: { idCustomerMembership: existing.idCustomerMembership },
      data: {
        isCurrent: false,
        status: GenericStatus.inactive,
      },
    });
  }

  const created = await tx.customerMembership.create({
    data: {
      idAccount: input.idAccount,
      idUser: input.idUser,
      idMembershipType: input.idMembershipType,
      startDate: input.startDate,
      endDate: input.endDate,
      status: GenericStatus.active,
      isCurrent: true,
      createdAt: input.createdAt,
    },
    select: {
      idCustomerMembership: true,
      idMembershipType: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  });

  return {
    created,
    previous: existing
      ? {
          idCustomerMembership: existing.idCustomerMembership,
          idMembershipType: existing.idMembershipType,
          status: existing.status,
          startDate: existing.startDate,
          endDate: existing.endDate,
        }
      : null,
  };
}
