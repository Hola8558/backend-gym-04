import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/** Minimal plan info for customer-facing membership responses. */
export class MembershipPlanSummaryResponseDto {
  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  price: string;
}
