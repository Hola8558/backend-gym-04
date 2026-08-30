import type { MembershipAction } from './membership-action.const';

/** Parameters for persisting one membership movement row (audit trail). */
export interface LogMembershipMovementParams {
  idAccount: number;
  idUser: number;
  idNewMembership: number;
  idOldMembership: number | null;
  actionType: MembershipAction;
  /** Effective membership start (UTC). */
  startDate: Date;
  /** Effective membership end (UTC). */
  endDate: Date;
}
