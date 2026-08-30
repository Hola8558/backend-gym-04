import { plainToInstance } from 'class-transformer';
import { CustomerResponseDto } from '../dto/customer-response.dto';
import { CustomerSource } from '../types/customer-source.type';
import { resolveCustomerDisplayStatus } from './resolve-customer-display-status.util';

export type CustomerResponseMapperOptions = {
  usesMembershipManagedStatus: boolean;
};

function mapAssignedCoachName(row: CustomerSource): string | null {
  const coachProfile = row.profile?.coach?.profile;
  if (!coachProfile) {
    return null;
  }
  const full = `${coachProfile.name ?? ''} ${coachProfile.lastName ?? ''}`.trim();
  return full.length > 0 ? full : null;
}

export function toCustomerResponseDto(
  row: CustomerSource,
  options?: CustomerResponseMapperOptions,
): CustomerResponseDto {
  const usesMembershipManagedStatus =
    options?.usesMembershipManagedStatus ?? false;
  const membership = row.customerMembership;
  const displayStatus = resolveCustomerDisplayStatus(
    row.status,
    membership
      ? { status: membership.status, endDate: membership.endDate }
      : null,
    usesMembershipManagedStatus,
  );

  return plainToInstance(
    CustomerResponseDto,
    {
      id: row.idUser,
      user_number: row.userNumber,
      name: row.profile?.name ?? '',
      lastname: row.profile?.lastName ?? '',
      email: row.email,
      birthdate: row.birthdate
        ? new Date(row.birthdate).toISOString().slice(0, 10)
        : null,
      phone: row.profile?.phone ?? null,
      emergency_phone: row.profile?.emergencyPhone ?? null,
      observations: row.profile?.observations ?? null,
      activeMembershipName: membership?.membershipType?.name ?? null,
      membership_type_id: membership?.idMembershipType ?? null,
      active_routines_count: row.activeRoutinesCount ?? 0,
      assignedCoachName: mapAssignedCoachName(row),
      status: displayStatus,
      created_at: row.profile?.createdAt ?? row.editAt,
    },
    { excludeExtraneousValues: true },
  );
}
