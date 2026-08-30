import { ApiProperty } from '@nestjs/swagger';

export class DashboardLoyaltyRowDto {
  @ApiProperty({ description: 'Display name from profile, email, or user number.' })
  name!: string;

  @ApiProperty({
    example: '24 meses activos',
    description: 'Human-readable tenure summary for the list widget.',
  })
  description!: string;
}
