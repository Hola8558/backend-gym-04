import { UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsCommonEmailDomain } from '../../common/decorators/is-common-email-domain.decorator';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
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
   * For `role: coach`, omit: `createUserWithProfile` uses the generated `userNumber` as the plain password.
   * For customers created via `POST /users`, omit: the service uses the generated `userNumber` as the initial password.
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
  @Type(() => Number)
  @IsNumber()
  coachId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  membershipId?: number;

  @IsOptional()
  @ValidateIf((_, v) => v != null && String(v).trim() !== '')
  @IsDateString()
  birthdate?: string;
}
