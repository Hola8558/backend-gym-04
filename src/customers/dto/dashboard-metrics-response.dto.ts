import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DashboardBirthdayRowDto } from './dashboard-birthday-row.dto';
import { DashboardExpiringSoonRowDto } from './dashboard-expiring-soon-row.dto';
import { DashboardLoyaltyRowDto } from './dashboard-loyalty-row.dto';
import { DashboardInactiveCustomerRowDto } from './dashboard-inactive-customer-row.dto';
import { DashboardRiskyCustomerRowDto } from './dashboard-risky-customer-row.dto';
import { DashboardMembershipDistributionPointDto } from './dashboard-membership-distribution-point.dto';
import { DashboardSignUpTrendPointDto } from './dashboard-sign-up-trend-point.dto';

export class DashboardMetricsResponseDto {
  @ApiProperty({ description: 'Active customer memberships for the account (vigente hoy).' })
  active_members_count!: number;

  @ApiProperty({
    description: 'Customer-role users whose profile was created in the last 30 UTC calendar days.',
  })
  new_customers_last_30_days!: number;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Omitted when the caller cannot view membership metrics (RBAC + feature 5006 for solo_coach). Otherwise: count of membership_histories with action_type RENEWAL in the last 30 UTC days.',
  })
  renewals_last_30_days!: number | null;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Omitted when the caller cannot view access metrics (RBAC + feature 5001). Otherwise: entry_logs active count for the crowdmeter calendar day in crowdmeter_timezone.',
  })
  attendances_today!: number | null;

  @ApiPropertyOptional({
    type: [Number],
    nullable: true,
    description:
      'Omitted when access metrics are not allowed. Otherwise: 12 integers for 2h buckets on the same calendar day as attendances_today.',
    example: [0, 1, 0, 2, 5, 8, 12, 10, 6, 3, 1, 0],
  })
  access_crowdmeter_today!: number[] | null;

  @ApiPropertyOptional({
    type: [DashboardSignUpTrendPointDto],
    nullable: true,
    description:
      'Omitted when membership metrics are not allowed. Otherwise: six UTC months of renewals for trend_year + trend_half.',
  })
  renewals_trend!: DashboardSignUpTrendPointDto[] | null;

  @ApiProperty({
    type: [DashboardSignUpTrendPointDto],
    description:
      'All 12 UTC calendar months of full_year_trend_year, Jan–Dec, oldest first. Customer sign-ups by profile.createdAt.',
  })
  sign_up_trend_full_year!: DashboardSignUpTrendPointDto[];

  @ApiPropertyOptional({
    type: [DashboardMembershipDistributionPointDto],
    nullable: true,
    description: 'Omitted when membership metrics are not allowed.',
  })
  membership_distribution!: DashboardMembershipDistributionPointDto[] | null;

  @ApiPropertyOptional({
    type: [DashboardExpiringSoonRowDto],
    nullable: true,
    description: 'Omitted when membership metrics are not allowed.',
  })
  expiring_soon!: DashboardExpiringSoonRowDto[] | null;

  @ApiProperty({
    type: [DashboardBirthdayRowDto],
    description:
      'Active customers (same membership rules as active_members_count) with a birthdate in the current calendar month (server local). Sorted by day-of-month ascending.',
  })
  birthdays_this_month!: DashboardBirthdayRowDto[];

  @ApiPropertyOptional({
    nullable: true,
    description: 'Omitted when membership metrics are not allowed.',
    example: 12.5,
  })
  cancellation_rate_percent!: number | null;

  @ApiPropertyOptional({
    type: [DashboardLoyaltyRowDto],
    nullable: true,
    description: 'Omitted when membership metrics are not allowed.',
  })
  loyalty_ranking!: DashboardLoyaltyRowDto[] | null;

  @ApiProperty({
    type: [DashboardInactiveCustomerRowDto],
    description:
      'Exactly 0–6 rows: mix of expired, deleted, and banned customers (2+2+2 when possible, fallback quota, round-robin order).',
  })
  inactive_customers!: DashboardInactiveCustomerRowDto[];

  @ApiPropertyOptional({
    type: [DashboardRiskyCustomerRowDto],
    nullable: true,
    description: 'Omitted when access metrics are not allowed.',
  })
  risky_customers!: DashboardRiskyCustomerRowDto[] | null;
}
