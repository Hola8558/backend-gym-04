import { PersonalInfoResponseDto } from '../dto/personal-info-response.dto';
import type { PersonalInfoSource } from '../types/personal-info-source.type';

export function toPersonalInfoResponseDto(
  row: PersonalInfoSource,
): PersonalInfoResponseDto {
  const parts = [row.profile?.name?.trim(), row.profile?.lastName?.trim()].filter(
    (p): p is string => Boolean(p && p.length > 0),
  );

  return {
    name: parts.join(' '),
    email: row.email,
    user_number: row.userNumber,
    phone_number: row.profile?.phone ?? null,
    emergency_phone_number: row.profile?.emergencyPhone ?? null,
  };
}
