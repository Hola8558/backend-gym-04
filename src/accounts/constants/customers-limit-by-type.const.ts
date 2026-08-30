import { AccountType } from '@prisma/client';

export const CUSTOMERS_LIMIT_BY_TYPE: Record<AccountType, number> = {
  [AccountType.coach]: 30,
  [AccountType.personalized]: 30,
  [AccountType.studio]: 120,
  [AccountType.pro]: 500,
  [AccountType.business]: 1000,
};
