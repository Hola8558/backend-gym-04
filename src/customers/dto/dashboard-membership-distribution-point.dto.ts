import { ApiProperty } from '@nestjs/swagger';

export class DashboardMembershipDistributionPointDto {
  @ApiProperty({ description: 'Membership type id for the current account.' })
  id_membership_type!: number;

  @ApiProperty({ description: 'Membership type display name.' })
  name!: string;

  @ApiProperty({ description: 'Active memberships for that plan (non-deleted/banned customers).' })
  value!: number;
}
