import { plainToInstance } from 'class-transformer';
import { CustomerBanHistoryEntryDto } from '../dto/customer-ban-history-entry.dto';
import type { CustomerBanHistoryRow } from '../types/customer-ban-history-source.type';

function formatPersonName(
  profile: { name: string | null; lastName: string | null } | null | undefined,
): string {
  if (!profile) {
    return '';
  }
  const parts = [profile.name, profile.lastName].filter(
    (p): p is string => typeof p === 'string' && p.trim().length > 0,
  );
  return parts.join(' ').trim();
}

export function toCustomerBanHistoryEntryDto(
  row: CustomerBanHistoryRow,
): CustomerBanHistoryEntryDto {
  return plainToInstance(
    CustomerBanHistoryEntryDto,
    {
      idBan: row.idBan,
      bannedAt: row.createdAt.toISOString(),
      bannedBy: formatPersonName(row.coach.profile),
      reason: row.reason,
      status: row.status,
      liftedAt: row.liftedAt ? row.liftedAt.toISOString() : null,
      liftedBy: row.liftedBy
        ? formatPersonName(row.liftedBy.profile) || null
        : null,
      liftReason: row.liftReason,
    },
    { excludeExtraneousValues: true },
  );
}
