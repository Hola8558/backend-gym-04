import { GenericStatus, type Prisma } from '@prisma/client';

export const kioskCustomerCandidateSelect = {
  idUser: true,
  userNumber: true,
  email: true,
  profile: { select: { name: true, lastName: true } },
  customerMemberships: {
    where: {
      isCurrent: true,
      status: { not: GenericStatus.deleted },
    },
    orderBy: [
      { createdAt: 'desc' as const },
      { idCustomerMembership: 'desc' as const },
    ],
    take: 1,
    select: { status: true, endDate: true },
  },
} satisfies Prisma.UserSelect;

export type KioskCustomerCandidate = Prisma.UserGetPayload<{
  select: typeof kioskCustomerCandidateSelect;
}>;
