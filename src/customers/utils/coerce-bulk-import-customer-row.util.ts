import type { BulkImportCustomerCoercedRow } from '../../users/types/bulk-import-customer-row.type';

export type BulkImportCustomerRowInput = {
  name?: string | null;
  lastname?: string | null;
  birthdate?: string | null;
  email?: string | null;
  phone?: string | null;
  emergency_phone?: string | null;
  observations?: string | null;
};

function toNullableString(value: string | null | undefined): string | null {
  const normalized = (value ?? '').trim();
  return normalized.length > 0 ? normalized : null;
}

function parseBirthdate(value: string | null | undefined): Date | null {
  const raw = (value ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return null;
  }
  return new Date(`${raw}T00:00:00.000Z`);
}

export function coerceBulkImportCustomerRow(
  row: BulkImportCustomerRowInput,
  index: number,
): BulkImportCustomerCoercedRow {
  const name = (row.name ?? '').trim() || 'Imported';
  const lastname = (row.lastname ?? '').trim() || 'Customer';
  const email =
    (row.email ?? '').trim() ||
    `import-${Date.now()}-${index}@import.invalid`;

  return {
    name,
    lastname,
    email,
    phone: toNullableString(row.phone),
    emergency_phone: toNullableString(row.emergency_phone),
    observations: toNullableString(row.observations),
    birthdate: parseBirthdate(row.birthdate),
  };
}
