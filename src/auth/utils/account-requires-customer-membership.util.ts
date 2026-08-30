import {
  AccountType,
  GenericStatus,
  PrismaClient,
  UserRole,
} from '@prisma/client';
import { isSoloCoachAccountType } from '../../common/utils/is-solo-coach-account-type.util';
import { CUSTOMER_LOGIN_FEATURE_MEMBERSHIP_MANAGEMENT } from '../constants/customer-login.constants';

type PrismaLike = Pick<PrismaClient, 'featureFlag'>;

/**
 * Gym (and non–solo-coach account types) always require an active customer membership at login.
 * Solo coach accounts (`AccountType.coach` and `AccountType.personalized`) require membership only when feature 5006 is active
 * on the account's solo coach user (membership management enabled).
 */
export async function accountRequiresCustomerMembership(
  prisma: PrismaLike,
  idAccount: number,
  accountType: AccountType,
): Promise<boolean> {
  if (!isSoloCoachAccountType(accountType)) {
    return true;
  }

  const membershipManagementFlag = await prisma.featureFlag.findFirst({
    where: {
      idFeature: CUSTOMER_LOGIN_FEATURE_MEMBERSHIP_MANAGEMENT,
      status: GenericStatus.active,
      feature: { status: GenericStatus.active },
      user: {
        idAccount,
        role: UserRole.solo_coach,
        status: { notIn: [GenericStatus.deleted, GenericStatus.banned] },
      },
    },
    select: { idUser: true },
  });

  return membershipManagementFlag != null;
}
