import { plainToInstance } from 'class-transformer';
import { KioskCustomerResultDto } from '../dto/kiosk-customer-result.dto';
import type { KioskCustomerCandidate } from '../types/kiosk-customer-candidate.type';
import { buildKioskDisplayName } from './build-kiosk-display-name.util';
import { maskUserNumber } from './mask-user-number.util';
import { resolveKioskMembershipStatus } from './resolve-kiosk-membership-status.util';

export function toKioskCustomerResult(
  candidate: KioskCustomerCandidate,
): KioskCustomerResultDto {
  return plainToInstance(
    KioskCustomerResultDto,
    {
      idUser: candidate.idUser,
      displayName:
        buildKioskDisplayName(candidate.profile) ||
        maskUserNumber(candidate.userNumber),
      maskedNumber: maskUserNumber(candidate.userNumber),
      membershipStatus: resolveKioskMembershipStatus(
        candidate.customerMemberships[0] ?? null,
      ),
    },
    { excludeExtraneousValues: true },
  );
}
