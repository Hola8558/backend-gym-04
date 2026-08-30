import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CoachDashboardBirthdayRowDto {
  @ApiProperty()
  name!: string;

  @ApiProperty({ example: '1990-05-12' })
  birthdate!: string;

  @ApiProperty()
  is_today!: boolean;
}

export class CoachDashboardExpiringSoonRowDto {
  @ApiProperty()
  name!: string;

  @ApiProperty({ description: 'Whole UTC calendar days until membership end (inclusive-style vs owner widget).' })
  days_until_end!: number;
}

export class CoachDashboardRiskyCustomerRowDto {
  @ApiProperty()
  name!: string;

  @ApiProperty({ description: 'ngx-translate key for the inactive-days message.' })
  description_key!: string;

  @ApiPropertyOptional({ type: Object, description: 'Interpolation params for `description_key`.' })
  description_params?: { days: number };
}

/** Coach-scoped dashboard metrics (GET /dashboard/coach-metrics). */
export class CoachDashboardMetricsResponseDto {
  @ApiProperty()
  active_members_count!: number;

  @ApiProperty({ type: [CoachDashboardBirthdayRowDto] })
  birthdays_this_month!: CoachDashboardBirthdayRowDto[];

  @ApiProperty({
    description:
      'Membership renewals in the last 30 days (UTC) for customers assigned to this coach.',
  })
  renewals_last_30_days!: number;

  @ApiProperty({
    type: [CoachDashboardExpiringSoonRowDto],
    description: "Active memberships ending within the next 7 UTC days for this coach's customers.",
  })
  expiring_soon!: CoachDashboardExpiringSoonRowDto[];

  @ApiProperty({
    nullable: true,
    description:
      "Today's account-wide entry count; null when the gym owner does not have Entry Logs (5001) active.",
  })
  attendances_today!: number | null;

  @ApiProperty({
    nullable: true,
    type: [Number],
    description:
      'Twelve 2h crowdmeter bucket counts; null when the gym owner does not have Entry Logs (5001) active.',
  })
  access_crowdmeter_today!: number[] | null;

  @ApiProperty({
    nullable: true,
    type: [CoachDashboardRiskyCustomerRowDto],
    description: 'At-risk active members (no check-in in 14 UTC days) for the account.',
  })
  risky_customers!: CoachDashboardRiskyCustomerRowDto[] | null;
}
