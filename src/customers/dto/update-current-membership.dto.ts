import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, ValidateIf } from 'class-validator';

export class UpdateCurrentMembershipDto {
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @ValidateIf((_, value) => value != null && String(value).trim() !== '')
  @IsDateString()
  start_date?: string | null;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @ValidateIf((_, value) => value != null && String(value).trim() !== '')
  @IsDateString()
  end_date?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_membership_type?: number;
}
