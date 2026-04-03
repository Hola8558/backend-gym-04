import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  /**
   * Login identifier: user's email address **or** `user_number` (same value stored in `users.user_number`).
   */
  @IsString()
  @MinLength(1)
  identifier: string;

  @IsString()
  @MinLength(1)
  password: string;
}
