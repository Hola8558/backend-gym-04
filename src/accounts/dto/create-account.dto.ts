import { AccountType } from '@prisma/client';
import { IsCommonEmailDomain } from '../../common/decorators/is-common-email-domain.decorator';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEnum(AccountType)
  type: AccountType;

  @IsEmail()
  @IsCommonEmailDomain()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  branch?: string;
}
