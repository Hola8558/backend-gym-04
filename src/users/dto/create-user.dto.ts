import { UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsCommonEmailDomain } from '../../common/decorators/is-common-email-domain.decorator';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsCommonEmailDomain()
  email: string;

  /**
   * Optional. If omitted for coach/customer, initial password is the generated `userNumber`.
   * Coach and customer creates always set `requiresPasswordChange: true`.
   */
  @IsOptional()
  @IsString()
  password?: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  last_name: string;

  @IsOptional()
  @IsString()
  branch?: string;

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
  @IsObject()
  health_and_preferences?: Record<string, string[]>;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  coachId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  membershipId?: number;

  /** Calendar day `YYYY-MM-DD`. Falls back to today when a membership is assigned. */
  @IsOptional()
  @ValidateIf((_, v) => v != null && String(v).trim() !== '')
  @IsDateString()
  membership_start_date?: string | null;

  /** Calendar day `YYYY-MM-DD`. Falls back to start plus the plan duration. */
  @IsOptional()
  @ValidateIf((_, v) => v != null && String(v).trim() !== '')
  @IsDateString()
  membership_end_date?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v != null && String(v).trim() !== '')
  @IsDateString()
  birthdate?: string;

  /** Calendar day `YYYY-MM-DD`. Omitted values are stored as the current timestamp. */
  @IsOptional()
  @ValidateIf((_, v) => v != null && String(v).trim() !== '')
  @IsDateString()
  enrollment_date?: string | null;
}
