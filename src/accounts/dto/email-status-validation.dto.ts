import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class EmailStatusValidationDto {
  @ApiProperty({ example: 'coach@studio.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'ACCOUNT.ERRORS.EMAIL_REQUIRED' })
  @IsEmail({}, { message: 'ACCOUNT.ERRORS.INVALID_EMAIL' })
  email: string;
}
