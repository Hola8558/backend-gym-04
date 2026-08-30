import { ApiProperty } from '@nestjs/swagger';

export type DashboardInactiveCustomerChip = 'deleted' | 'banned' | 'expired';

export class DashboardInactiveCustomerRowDto {
  @ApiProperty({ description: 'Display name from profile, email, or user number.' })
  name!: string;

  @ApiProperty({ enum: ['deleted', 'banned', 'expired'] })
  chip_status!: DashboardInactiveCustomerChip;
}
