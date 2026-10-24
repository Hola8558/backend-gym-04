/** Normalized, tenant-safe list filters for active customers. */
export interface CustomerListFilters {
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRING';
  membershipId?: number;
  /** Coach user id, or "no coach" */
  coachId?: 'UNASSIGNED' | number;
  /** Active routine or menu rows for this customer. */
  coverage?: 'none' | 'some';
  coverageOf?: 'routines' | 'menus';
}
