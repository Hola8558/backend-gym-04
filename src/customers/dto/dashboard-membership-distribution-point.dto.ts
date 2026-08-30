import { ApiProperty } from '@nestjs/swagger';

export class DashboardMembershipDistributionPointDto {
  @ApiProperty({ description: 'Membership type display name.' })
  name!: string;

  @ApiProperty({ description: 'Active memberships for that plan (non-deleted/banned customers).' })
  value!: number;
}
