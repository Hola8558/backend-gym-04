import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenericStatus } from '@prisma/client';

/** Mobile customer membership: plan fields + assignment dates. */
export class MobileCustomerMembershipResponseDto {
  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  features!: string | null;

  @ApiProperty({ description: 'Plan price as decimal string' })
  price!: string;

  @ApiProperty()
  duration_days!: number;

  @ApiProperty()
  id_membership_type!: number;

  @ApiProperty({ enum: GenericStatus, description: 'Membership plan status' })
  status!: GenericStatus;

  @ApiProperty({ description: 'Assignment start date (ISO date)' })
  start_date!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Assignment end date (ISO date), null if open-ended',
  })
  end_date!: string | null;

  @ApiProperty({
    enum: GenericStatus,
    description: 'customer_memberships.status',
  })
  membership_status!: GenericStatus;
}
