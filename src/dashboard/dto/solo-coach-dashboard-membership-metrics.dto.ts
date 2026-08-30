import { ApiProperty } from '@nestjs/swagger';
import { DashboardExpiringSoonRowDto } from '../../customers/dto/dashboard-expiring-soon-row.dto';
import { DashboardLoyaltyRowDto } from '../../customers/dto/dashboard-loyalty-row.dto';
import { DashboardMembershipDistributionPointDto } from '../../customers/dto/dashboard-membership-distribution-point.dto';
import { DashboardSignUpTrendPointDto } from '../../customers/dto/dashboard-sign-up-trend-point.dto';

/** Membership slice for solo coach dashboard when feature 5006 is active. */
export class SoloCoachDashboardMembershipMetricsDto {
  @ApiProperty({
    description: 'Membership renewals in the last 30 UTC days.',
  })
  renewals_last_30_days!: number;

  @ApiProperty({
    type: [DashboardSignUpTrendPointDto],
    description: 'Six UTC months of renewals for the requested semester.',
  })
  renewals_trend!: DashboardSignUpTrendPointDto[];

  @ApiProperty({ type: [DashboardMembershipDistributionPointDto] })
  membership_distribution!: DashboardMembershipDistributionPointDto[];

  @ApiProperty({ type: [DashboardExpiringSoonRowDto] })
  expiring_soon!: DashboardExpiringSoonRowDto[];

  @ApiProperty({ example: 12.5 })
  cancellation_rate_percent!: number;

  @ApiProperty({ type: [DashboardLoyaltyRowDto] })
  loyalty_ranking!: DashboardLoyaltyRowDto[];
}
