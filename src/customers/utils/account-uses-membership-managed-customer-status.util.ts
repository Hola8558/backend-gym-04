import {
  GenericStatus,
  PrismaClient,
  UserRole,
} from '@prisma/client';
import { isSoloCoachAccountType } from '../../common/utils/is-solo-coach-account-type.util';
import { DASHBOARD_FEATURE_MEMBERSHIP_MANAGEMENT } from '../../dashboard/dashboard-metrics-gates';

type PrismaLike = Pick<PrismaClient, 'account' | 'featureFlag'>;

/**
 * Gym accounts always merge user + membership status in customer lists.
 * Solo coach accounts merge only when feature 5006 (membership management) is active.
 */
export async function accountUsesMembershipManagedCustomerStatus(
  prisma: PrismaLike,
  idAccount: number,
): Promise<boolean> {
  const account = await prisma.account.findUnique({
    where: { idAccount },
    select: { type: true },
  });
  if (!account) {
    return false;
  }

  if (!isSoloCoachAccountType(account.type)) {
    return true;
  }

  const membershipManagementFlag = await prisma.featureFlag.findFirst({
    where: {
      idFeature: DASHBOARD_FEATURE_MEMBERSHIP_MANAGEMENT,
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
