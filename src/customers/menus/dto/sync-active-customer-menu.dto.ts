import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, ValidateIf } from 'class-validator';

/**
 * Client cache stamp for the last menu received.
 * Omit both (or send null) on first fetch to always receive the full menu.
 */
export class SyncActiveCustomerMenuDto {
  @ApiPropertyOptional({
    description: 'ISO 8601 created_at from the last menu payload (null on first sync)',
    example: '2026-08-01T12:00:00.000Z',
    nullable: true,
  })
  @ValidateIf((_, v) => v != null)
  @IsDateString()
  @IsOptional()
  created_at?: string | null;

  @ApiPropertyOptional({
    description:
      'ISO 8601 last update (`updated_at`) from the last menu payload (null on first sync)',
    example: '2026-08-06T15:30:00.000Z',
    nullable: true,
  })
  @ValidateIf((_, v) => v != null)
  @IsDateString()
  @IsOptional()
  updated_at?: string | null;
}
