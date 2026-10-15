import { GenericStatus, Prisma, UserRole } from '@prisma/client';

/** Customers the kiosk may find or check in: active customers of the JWT tenant only. */
export function activeKioskCustomerWhere(idAccount: number): Prisma.UserWhereInput {
  return {
    idAccount,
    role: UserRole.customer,
    status: GenericStatus.active,
  };
}
