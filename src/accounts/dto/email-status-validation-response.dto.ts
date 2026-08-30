import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import type { EmailStatusValidationStatus } from '../types/email-status-validation-status.type';

export class EmailStatusValidationResponseDto {
  @Expose()
  @ApiProperty({ enum: ['active', 'expired', 'not_found'] })
  status: EmailStatusValidationStatus;

  @Expose()
  @ApiPropertyOptional()
  stripeLink?: string;
}
