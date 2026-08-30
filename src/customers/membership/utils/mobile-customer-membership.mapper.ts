import { MobileCustomerMembershipResponseDto } from '../dto/mobile-customer-membership-response.dto';
import type { MobileCustomerMembershipSource } from '../types/mobile-customer-membership-source.type';

function toIsoDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function toMobileCustomerMembershipResponseDto(
  row: MobileCustomerMembershipSource,
): MobileCustomerMembershipResponseDto {
  const plan = row.membershipType;
  return {
    name: plan.name,
    features: plan.features,
    price: plan.price.toString(),
    duration_days: plan.durationDays,
    id_membership_type: plan.idMembershipType,
    status: plan.status,
    start_date: toIsoDateOnly(row.startDate),
    end_date: row.endDate != null ? toIsoDateOnly(row.endDate) : null,
    membership_status: row.status,
  };
}
