import { GenericStatus, Prisma } from '@prisma/client';
import { startOfUtcDay } from '../../common/utils/utc-date.util';

const currentNotDeleted = {
  isCurrent: true,
  status: { not: GenericStatus.deleted },
} as const;

export function buildMembershipManagedActiveCustomerWhere(
  todayStart: Date = startOfUtcDay(new Date()),
): Prisma.UserWhereInput {
  return {
    status: GenericStatus.active,
    customerMemberships: {
      some: {
        isCurrent: true,
        status: GenericStatus.active,
        OR: [{ endDate: null }, { endDate: { gte: todayStart } }],
      },
    },
  };
}

export function buildMembershipManagedInactiveCustomerWhere(
  todayStart: Date = startOfUtcDay(new Date()),
): Prisma.UserWhereInput {
  return {
    OR: [
      { status: GenericStatus.inactive },
      {
        status: GenericStatus.active,
        OR: [
          {
            customerMemberships: {
              none: currentNotDeleted,
            },
          },
          {
            customerMemberships: {
              some: {
                isCurrent: true,
                status: GenericStatus.inactive,
              },
            },
          },
          {
            customerMemberships: {
              some: {
                isCurrent: true,
                status: GenericStatus.active,
                endDate: { lt: todayStart },
              },
            },
          },
        ],
      },
    ],
  };
}
