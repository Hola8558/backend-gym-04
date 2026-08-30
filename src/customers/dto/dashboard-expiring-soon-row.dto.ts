import { ApiProperty } from '@nestjs/swagger';

export class DashboardExpiringSoonRowDto {
  @ApiProperty({ description: 'Display name from profile, email, or user number.' })
  name!: string;

  @ApiProperty({
    description:
      'Whole UTC calendar days from today (UTC start of day) until membership end_date (inclusive of end day).',
  })
  days_until_end!: number;
}
