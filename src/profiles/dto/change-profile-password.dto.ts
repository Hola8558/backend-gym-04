import { ApiProperty } from '@nestjs/swagger';
import { Matches, MinLength } from 'class-validator';

export class ChangeProfilePasswordDto {
  @ApiProperty({ minLength: 8 })
  @MinLength(8, { message: 'AUTH.ERRORS.WEAK_PASSWORD' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message: 'AUTH.ERRORS.WEAK_PASSWORD',
  })
  password: string;
}
