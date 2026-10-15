import { PrismaService } from '../../core/prisma/prisma.service';
import { assertOwnerOrSoloCoachAccount } from '../../common/utils/assert-owner-or-solo-coach-account.util';

const FORBIDDEN = 'SETTINGS.ERRORS.MANDATORY_FIELDS_FORBIDDEN';

/** Owner or solo coach, with the account type confirmed from the database. */
export async function assertMandatoryFieldsManager(
  prisma: PrismaService,
  idAccount: number,
  idUser: number,
): Promise<void> {
  await assertOwnerOrSoloCoachAccount(prisma, idAccount, idUser, FORBIDDEN);
}
