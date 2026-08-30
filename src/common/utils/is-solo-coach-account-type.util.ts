import { AccountType } from '@prisma/client';

export function isSoloCoachAccountType(accountType: AccountType): boolean {
  return (
    accountType === AccountType.coach ||
    accountType === AccountType.personalized
  );
}
