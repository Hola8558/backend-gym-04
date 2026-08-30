import { GenericStatus } from '@prisma/client';
import type { EmailStatusValidationStatus } from '../types/email-status-validation-status.type';

export function mapAccountStatusToEmailValidationStatus(
  accountStatus: GenericStatus,
): Exclude<EmailStatusValidationStatus, 'not_found'> {
  if (
    accountStatus === GenericStatus.active ||
    accountStatus === GenericStatus.pending
  ) {
    return 'active';
  }
  return 'expired';
}
