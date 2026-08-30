export type BulkImportCustomerCoercedRow = {
  name: string;
  lastname: string;
  email: string;
  phone: string | null;
  emergency_phone: string | null;
  observations: string | null;
  birthdate: Date | null;
};
