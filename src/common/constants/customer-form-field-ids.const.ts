export const CUSTOMER_FORM_FIELD_IDS = [
  'name',
  'lastname',
  'birthdate',
  'enrollment_date',
  'phone',
  'emergency_phone',
  'observations',
  'email',
  'coach',
  'membership',
] as const;

export type CustomerFormFieldId = (typeof CUSTOMER_FORM_FIELD_IDS)[number];

export const DEFAULT_MANDATORY_CUSTOMER_FIELDS: CustomerFormFieldId[] = [
  'phone',
  'emergency_phone',
  'name',
  'email',
  'lastname',
  'enrollment_date',
];

const ALLOWED_CUSTOMER_FORM_FIELD_IDS = new Set<string>(CUSTOMER_FORM_FIELD_IDS);

export function normalizeMandatoryCustomerFields(
  values: readonly string[],
): CustomerFormFieldId[] {
  const selected = new Set(values);
  return CUSTOMER_FORM_FIELD_IDS.filter(
    (fieldId) =>
      ALLOWED_CUSTOMER_FORM_FIELD_IDS.has(fieldId) && selected.has(fieldId),
  );
}
