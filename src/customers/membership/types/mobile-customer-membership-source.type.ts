import type { GenericStatus, Prisma } from '@prisma/client';

export type MobileCustomerMembershipSource = {
  startDate: Date;
  endDate: Date | null;
  status: GenericStatus;
  membershipType: {
    idMembershipType: number;
    name: string;
    features: string | null;
    price: Prisma.Decimal;
    durationDays: number;
    status: GenericStatus;
  };
};
