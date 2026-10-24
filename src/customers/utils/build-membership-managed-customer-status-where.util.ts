import { GenericStatus, Prisma } from '@prisma/client';
import { addUtcDays, startOfUtcDay } from '../../common/utils/utc-date.util';

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

/** Current active membership ending today through the next 7 UTC days, inclusive. */
export function buildMembershipExpiringSoonCustomerWhere(
  todayStart: Date = startOfUtcDay(new Date()),
): Prisma.UserWhereInput {
  const weekEndInclusive = addUtcDays(todayStart, 7);
  return {
    status: { notIn: [GenericStatus.deleted, GenericStatus.banned] },
    customerMemberships: {
      some: {
        isCurrent: true,
        status: GenericStatus.active,
        endDate: {
          not: null,
          gte: todayStart,
          lte: weekEndInclusive,
        },
      },
    },
  };
}
