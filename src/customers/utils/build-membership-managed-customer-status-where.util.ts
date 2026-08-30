import { GenericStatus, Prisma } from '@prisma/client';
import { startOfUtcDay } from '../../common/utils/utc-date.util';

export function buildMembershipManagedActiveCustomerWhere(
  todayStart: Date = startOfUtcDay(new Date()),
): Prisma.UserWhereInput {
  return {
    status: GenericStatus.active,
    customerMembership: {
      is: {
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
          { customerMembership: { is: null } },
          {
            customerMembership: {
              is: { status: GenericStatus.inactive },
            },
          },
          {
            customerMembership: {
              is: {
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
