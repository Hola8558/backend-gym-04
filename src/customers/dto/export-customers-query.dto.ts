import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

const EXPORT_TABLES = ['active', 'deleted', 'banned'] as const;
export type CustomerExportTable = (typeof EXPORT_TABLES)[number];

const LIST_STATUSES = ['ACTIVE', 'INACTIVE', 'EXPIRING'] as const;

export class ExportCustomersQueryDto {
  @ApiProperty({ enum: EXPORT_TABLES })
  @IsIn(EXPORT_TABLES, { message: 'CUSTOMERS.ERRORS.INVALID_EXPORT_TABLE' })
  table!: CustomerExportTable;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ enum: LIST_STATUSES })
  @IsOptional()
  @IsIn(LIST_STATUSES, { message: 'CUSTOMERS.ERRORS.INVALID_LIST_FILTERS' })
  status?: (typeof LIST_STATUSES)[number];

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  membershipId?: number;

  /** `UNASSIGNED` or a coach's `id_user` (numeric string). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coachId?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  membershipTypeId?: number;
}
