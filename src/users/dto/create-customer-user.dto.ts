import { ApiPropertyOptional } from '@nestjs/swagger';
import { OmitType } from '@nestjs/mapped-types';
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { IsCommonEmailDomain } from '../../common/decorators/is-common-email-domain.decorator';
import { CreateUserDto } from './create-user.dto';

export class CreateCustomerUserDto extends OmitType(CreateUserDto, [
  'role',
  'password',
  'email',
  'name',
  'last_name',
] as const) {
  @IsOptional()
  @ValidateIf((_, value) => typeof value === 'string' && value.trim() !== '')
  @IsEmail()
  @IsCommonEmailDomain()
  email?: string;

  @IsOptional()
  @ValidateIf((_, value) => typeof value === 'string' && value.trim() !== '')
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @ValidateIf((_, value) => typeof value === 'string' && value.trim() !== '')
  @IsString()
  @MinLength(1)
  last_name?: string;

  /**
   * Optional: omit to use the generated `user_number` as the initial password (hashed server-side).
   */
  @ApiPropertyOptional({ minLength: 8 })
  @IsOptional()
  @ValidateIf(
    (_, v) => v !== undefined && v !== null && String(v).trim().length > 0,
  )
  @IsString()
  @MinLength(8)
  password?: string;
}
