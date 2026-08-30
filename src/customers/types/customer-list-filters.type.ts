/** Normalized, tenant-safe list filters for active customers. */
export interface CustomerListFilters {
  status?: 'ACTIVE' | 'INACTIVE';
  membershipId?: number;
  /** Coach user id, or "no coach" */
  coachId?: 'UNASSIGNED' | number;
}
