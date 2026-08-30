import { plainToInstance } from 'class-transformer';
import { DeletedCustomerResponseDto } from '../dto/deleted-customer-response.dto';
import { DeletedCustomerSource } from '../types/deleted-customer-source.type';

function formatDeletedByName(
  deletedBy: DeletedCustomerSource['deletedBy'],
): string | null {
  const p = deletedBy?.profile;
  if (!p) {
    return null;
  }
  const parts = [p.name, p.lastName].filter(
    (x): x is string => typeof x === 'string' && x.trim().length > 0,
  );
  const s = parts.join(' ').trim();
  return s.length > 0 ? s : null;
}

export function toDeletedCustomerResponseDto(
  row: DeletedCustomerSource,
): DeletedCustomerResponseDto {
  return plainToInstance(
    DeletedCustomerResponseDto,
    {
      id: row.idUser,
      user_number: row.userNumber,
      name: row.profile?.name ?? '',
      lastname: row.profile?.lastName ?? '',
      email: row.email,
      phone: row.profile?.phone ?? null,
      emergency_phone: row.profile?.emergencyPhone ?? null,
      activeMembershipName:
        row.customerMembership?.membershipType?.name ?? null,
      membership_type_id: row.customerMembership?.idMembershipType ?? null,
      deleted_at: row.editAt.toISOString(),
      deletedBy: formatDeletedByName(row.deletedBy),
      status: row.status,
    },
    { excludeExtraneousValues: true },
  );
}
