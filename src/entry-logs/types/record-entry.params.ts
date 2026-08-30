import type { GenericStatus } from '@prisma/client';

/** Payload for persisting one `entry_logs` row (caller validates access). */
export interface RecordEntryParams {
  idAccount: number;
  idUser: number;
  status: GenericStatus;
  entryDate?: Date;
}
