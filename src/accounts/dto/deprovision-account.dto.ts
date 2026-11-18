import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import { ACCOUNT_PROVISION_CONFIRM_PRODUCTION } from '../constants/account-provision.constants';

export class DeprovisionAccountDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEmail()
  email: string;

  @IsIn([ACCOUNT_PROVISION_CONFIRM_PRODUCTION], {
    message: 'ACCOUNTS.ERRORS.DEPROVISION_CONFIRMATION_REQUIRED',
  })
  confirm: string;
}
