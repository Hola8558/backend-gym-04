import { plainToInstance } from 'class-transformer';
import { ProfileResponseDto } from '../dto/profile-response.dto';
import { ProfileSourceRow } from '../types/profile-source.type';

export function mapProfileResponse(row: ProfileSourceRow): ProfileResponseDto {
  return plainToInstance(ProfileResponseDto, {
    first_name: row.profile?.name ?? null,
    last_name: row.profile?.lastName ?? null,
    business_name: row.account?.name ?? null,
    email: row.email ?? null,
    phone: row.profile?.phone ?? null,
    registration_date: row.profile?.createdAt?.toISOString() ?? null,
    role: row.role,
  });
}
