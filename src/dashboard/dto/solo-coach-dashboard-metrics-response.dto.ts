import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DashboardBirthdayRowDto } from '../../customers/dto/dashboard-birthday-row.dto';
import { DashboardInactiveCustomerRowDto } from '../../customers/dto/dashboard-inactive-customer-row.dto';
import { DashboardSignUpTrendPointDto } from '../../customers/dto/dashboard-sign-up-trend-point.dto';
import { SoloCoachDashboardMembershipMetricsDto } from './solo-coach-dashboard-membership-metrics.dto';

/** GET /dashboard/solo-coach-metrics — owner-like business KPIs without access metrics. */
export class SoloCoachDashboardMetricsResponseDto {
  @ApiProperty()
  active_members_count!: number;

  @ApiProperty()
  new_customers_last_30_days!: number;

  @ApiProperty({ type: [DashboardSignUpTrendPointDto] })
  sign_up_trend_full_year!: DashboardSignUpTrendPointDto[];

  @ApiProperty({ type: [DashboardInactiveCustomerRowDto] })
  inactive_customers!: DashboardInactiveCustomerRowDto[];

  @ApiProperty({ type: [DashboardBirthdayRowDto] })
  birthdays_this_month!: DashboardBirthdayRowDto[];

  @ApiPropertyOptional({
    type: SoloCoachDashboardMembershipMetricsDto,
    nullable: true,
    description:
      'Null when the solo coach user does not have Entry Logs membership management (5006) active.',
  })
  memberships!: SoloCoachDashboardMembershipMetricsDto | null;
}
