import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @ValidateIf((_, value) => value != null && String(value).trim() !== '')
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  emergency_phone?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @ValidateIf((_, value) => value != null)
  @IsObject()
  health_and_preferences?: Record<string, string[]> | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  coachId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  membershipId?: number;

  /** Omit to leave unchanged; send `null` or empty string to clear. */
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && String(v).trim() !== '')
  @IsDateString()
  birthdate?: string | null;

  /** Omit to leave unchanged; send `null` or empty string to clear. */
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && String(v).trim() !== '')
  @IsDateString()
  enrollment_date?: string | null;
}
