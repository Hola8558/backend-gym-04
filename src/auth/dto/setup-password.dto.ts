import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

/** Body for POST /auth/setup-password (public: identifier + new password). */
export class SetupPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  identifier: string;

  @ApiProperty({ minLength: 8 })
  @MinLength(8, { message: 'AUTH.ERRORS.WEAK_PASSWORD' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message: 'AUTH.ERRORS.WEAK_PASSWORD',
  })
  newPassword: string;
}
