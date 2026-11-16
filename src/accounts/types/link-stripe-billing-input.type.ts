import { AccountType, GenericStatus } from '@prisma/client';

export type LinkStripeBillingInput = {
  idAccount: number;
  stripeCustomerId: string;
  status: GenericStatus | null;
  type: AccountType | null;
};
