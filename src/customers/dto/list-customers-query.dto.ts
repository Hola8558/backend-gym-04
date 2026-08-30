import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const LIST_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type CustomerListQueryStatus = (typeof LIST_STATUSES)[number];

export class ListCustomersQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 50, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  search?: string;

  /** Legacy alias for `search` (e.g. `GET .../search?q=`) */
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  q?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsIn(LIST_STATUSES)
  status?: CustomerListQueryStatus;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  membershipId?: number;

  /** `UNASSIGNED` or a coach's `id_user` (numeric string) */
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  coachId?: string;
}
