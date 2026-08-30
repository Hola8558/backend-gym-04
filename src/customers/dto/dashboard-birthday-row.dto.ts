import { ApiProperty } from '@nestjs/swagger';

export class DashboardBirthdayRowDto {
  @ApiProperty({ description: 'Display name from profile, email, or user number.' })
  name!: string;

  @ApiProperty({
    description: 'Calendar birth date (YYYY-MM-DD).',
    example: '1995-08-15',
  })
  birthdate!: string;

  @ApiProperty({
    description:
      'True when this row’s calendar month/day matches the server’s local date (celebration row).',
  })
  is_today!: boolean;
}
