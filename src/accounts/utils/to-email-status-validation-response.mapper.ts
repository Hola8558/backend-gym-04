import { plainToInstance } from 'class-transformer';
import { EmailStatusValidationResponseDto } from '../dto/email-status-validation-response.dto';
import type { EmailStatusValidationStatus } from '../types/email-status-validation-status.type';

export function toEmailStatusValidationResponseDto(
  status: EmailStatusValidationStatus,
  stripeLink?: string,
): EmailStatusValidationResponseDto {
  return plainToInstance(
    EmailStatusValidationResponseDto,
    stripeLink ? { status, stripeLink } : { status },
    { excludeExtraneousValues: true },
  );
}
