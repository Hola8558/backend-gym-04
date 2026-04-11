import { ApiProperty } from '@nestjs/swagger';
import { GenericStatus } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import { MembershipPlanSummaryResponseDto } from './membership-plan-summary-response.dto';

/**
 * Customer membership as returned to clients (no internal PKs, user, or account ids).
 */
export class CustomerMembershipResponseDto {
  @Expose()
  @ApiProperty()
  startDate: Date;

  @Expose()
  @ApiProperty({ nullable: true })
  endDate: Date | null;

  @Expose()
  @ApiProperty({ enum: GenericStatus })
  status: GenericStatus;

  @Expose()
  @Type(() => MembershipPlanSummaryResponseDto)
  @ApiProperty({ type: MembershipPlanSummaryResponseDto })
  membershipType: MembershipPlanSummaryResponseDto;
}
