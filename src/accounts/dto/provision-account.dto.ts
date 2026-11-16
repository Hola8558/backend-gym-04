import { AccountType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ACCOUNT_PROVISION_CONFIRM_PRODUCTION } from '../constants/account-provision.constants';

export class ProvisionAccountDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEnum(AccountType)
  type: AccountType;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsIn([ACCOUNT_PROVISION_CONFIRM_PRODUCTION], {
    message: 'ACCOUNTS.ERRORS.PROVISION_CONFIRMATION_REQUIRED',
  })
  confirm: string;
}
