import { GenericStatus } from '@prisma/client';

export type ExportProfileName = {
  name: string | null;
  lastName: string | null;
} | null;

export type ExportMembership = {
  status: GenericStatus;
  startDate: Date;
  endDate: Date | null;
  membershipType: { name: string; price: { toString(): string } };
};

export type ExportCustomerFields = {
  userNumber: string | null;
  email: string | null;
  status: GenericStatus;
  profile: {
    name: string | null;
    lastName: string | null;
    phone: string | null;
    emergencyPhone: string | null;
    enrollmentDate: Date | null;
    createdAt: Date;
    coach: { profile: ExportProfileName } | null;
  } | null;
  customerMemberships: ExportMembership[];
};

export function trimmed(value: string | null | undefined): string | null {
  const next = value?.trim();
  return next ? next : null;
}

export function isoDate(value: Date | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return value.toISOString().slice(0, 10);
}

export function isoDateTime(value: Date | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return value.toISOString().slice(0, 16).replace('T', ' ');
}

export function personName(profile: ExportProfileName): string | null {
  const parts = [profile?.name, profile?.lastName]
    .map((part) => part?.trim())
    .filter((part): part is string => !!part);
  return parts.length > 0 ? parts.join(' ') : null;
}

export function ageInYears(birthdate: Date, today: Date): number {
  const birth = birthdate.toISOString().slice(0, 10);
  const now = today.toISOString().slice(0, 10);
  const by = Number(birth.slice(0, 4));
  const bm = Number(birth.slice(5, 7));
  const bd = Number(birth.slice(8, 10));
  const ty = Number(now.slice(0, 4));
  const tm = Number(now.slice(5, 7));
  const td = Number(now.slice(8, 10));
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) {
    age -= 1;
  }
  return Math.max(0, age);
}

export function formatInTimeZone(value: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${read('year')}-${read('month')}-${read('day')} ${read('hour')}:${read('minute')}`;
}

export function membershipOf(customer: ExportCustomerFields): ExportMembership | null {
  return customer.customerMemberships[0] ?? null;
}

export function identityColumns(customer: ExportCustomerFields): {
  user_number: string | null;
  name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
} {
  return {
    user_number: trimmed(customer.userNumber),
    name: trimmed(customer.profile?.name),
    last_name: trimmed(customer.profile?.lastName),
    email: trimmed(customer.email),
    phone: trimmed(customer.profile?.phone),
  };
}
