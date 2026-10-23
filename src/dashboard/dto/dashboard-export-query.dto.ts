import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DashboardExportQueryDto {
  @ApiProperty({
    description: 'Comma-separated dashboard metric ids to export.',
    example: 'active_customers,birthdays',
  })
  @IsString()
  @IsNotEmpty()
  metrics!: string;

  @ApiPropertyOptional({ enum: ['memberships', 'enrollment'] })
  @IsOptional()
  @IsIn(['memberships', 'enrollment'])
  loyalty_by?: 'memberships' | 'enrollment';

  @ApiPropertyOptional({
    description: 'IANA time zone for today attendance timestamps.',
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}
