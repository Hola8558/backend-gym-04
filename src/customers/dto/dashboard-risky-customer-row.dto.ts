import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** i18n keys consumed by the dashboard list widget (ngx-translate). */
export class DashboardRiskyCustomerRowDto {
  @ApiProperty({ description: 'Display name (profile, email, or user number).' })
  name!: string;

  @ApiProperty({
    description:
      'Translation key for the right column. Use `DASHBOARD.ACCESS.RISKY_INACTIVE_DAYS` with `description_params.days`, or `DASHBOARD.ACCESS.TOO_LONG_AGO` when no entry_logs exist.',
    example: 'DASHBOARD.ACCESS.RISKY_INACTIVE_DAYS',
  })
  description_key!: string;

  @ApiPropertyOptional({
    description: 'Interpolation payload for ngx-translate (e.g. `{ "days": 18 }`).',
    example: { days: 18 },
  })
  description_params?: { days: number };
}
