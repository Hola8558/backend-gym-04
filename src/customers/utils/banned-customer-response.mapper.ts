import { BanStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { BannedCustomerResponseDto } from '../dto/banned-customer-response.dto';
import type { BannedBanRowSource } from '../types/banned-customer-source.type';

function formatPersonName(
  profile: { name: string | null; lastName: string | null } | null,
): string {
  if (!profile) {
    return '';
  }
  const parts = [profile.name, profile.lastName].filter(
    (p): p is string => typeof p === 'string' && p.trim().length > 0,
  );
  return parts.join(' ').trim();
}

export function toBannedCustomerResponseDto(
  row: BannedBanRowSource,
): BannedCustomerResponseDto {
  const c = row.customer;
  const bannedAt = row.createdAt.toISOString();
  const bannedBy = formatPersonName(row.coach.profile);
  const membership_type_id =
    c.customerMembership?.idMembershipType ?? null;

  const dto: BannedCustomerResponseDto = {
    idBan: row.idBan,
    id: c.idUser,
    user_number: c.userNumber,
    name: c.profile?.name ?? '',
    lastname: c.profile?.lastName ?? '',
    email: c.email,
    bannedAt,
    reason: row.reason,
    bannedBy,
    status: row.status ?? BanStatus.ACTIVE,
    membership_type_id,
  };

  return plainToInstance(BannedCustomerResponseDto, dto, {
    excludeExtraneousValues: true,
  });
}
