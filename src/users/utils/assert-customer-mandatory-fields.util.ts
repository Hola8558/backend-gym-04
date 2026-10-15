import { BadRequestException } from '@nestjs/common';
import {
  CustomerFormFieldId,
  DEFAULT_MANDATORY_CUSTOMER_FIELDS,
} from '../../common/constants/customer-form-field-ids.const';
import { PrismaService } from '../../core/prisma/prisma.service';

const MANDATORY_FIELD_ERROR_KEYS: Record<CustomerFormFieldId, string> = {
  name: 'CUSTOMERS.FORM.ERRORS.NAME_REQUIRED',
  lastname: 'CUSTOMERS.FORM.ERRORS.LASTNAME_REQUIRED',
  birthdate: 'CUSTOMERS.FORM.ERRORS.BIRTHDATE_REQUIRED',
  enrollment_date: 'CUSTOMERS.FORM.ERRORS.ENROLLMENT_DATE_REQUIRED',
  phone: 'CUSTOMERS.FORM.ERRORS.PHONE_REQUIRED',
  emergency_phone: 'CUSTOMERS.FORM.ERRORS.EMERGENCY_PHONE_REQUIRED',
  observations: 'CUSTOMERS.FORM.ERRORS.OBSERVATIONS_REQUIRED',
  email: 'CUSTOMERS.FORM.ERRORS.EMAIL_REQUIRED',
  coach: 'CUSTOMERS.FORM.ERRORS.COACH_REQUIRED',
  membership: 'CUSTOMERS.FORM.ERRORS.MEMBERSHIP_REQUIRED',
};

export function parseEnrollmentDate(
  value: string | null | undefined,
): Date | null {
  if (isBlank(value)) {
    return null;
  }
  const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function blankToNull(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function isBlank(value: string | null | undefined): boolean {
  return blankToNull(value) == null;
}

export async function loadMandatoryCustomerFieldIds(
  prisma: PrismaService,
  idAccount: number,
): Promise<Set<string>> {
  const detail = await prisma.accountDetail.findUnique({
    where: { idAccount },
    select: { mandatoryFields: true },
  });
  const stored = detail?.mandatoryFields ?? DEFAULT_MANDATORY_CUSTOMER_FIELDS;
  return new Set(stored);
}

export function assertCustomerMandatoryFields(
  mandatory: ReadonlySet<string>,
  checks: Array<{ field: CustomerFormFieldId; missing: boolean }>,
): void {
  for (const check of checks) {
    if (!check.missing) {
      continue;
    }
    if (!mandatory.has(check.field)) {
      continue;
    }
    throw new BadRequestException(MANDATORY_FIELD_ERROR_KEYS[check.field]);
  }
}
