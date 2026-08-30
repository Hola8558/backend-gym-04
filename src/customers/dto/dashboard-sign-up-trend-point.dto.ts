import { ApiProperty } from '@nestjs/swagger';

/** One month bucket for sign-up trend (UTC month start, YYYY-MM-DD). */
export class DashboardSignUpTrendPointDto {
  @ApiProperty({
    example: '2025-01-01',
    description: 'First calendar day of the month in UTC (ISO date).',
  })
  month_start!: string;

  @ApiProperty({ description: 'Number of customer profiles created in that month (all statuses).' })
  count!: number;
}
