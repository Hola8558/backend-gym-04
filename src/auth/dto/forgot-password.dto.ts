import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'User email address or user_number',
    example: 'user@example.com',
  })
  @IsString()
  @MinLength(1)
  identifier: string;

  @ApiProperty({
    description: 'Active UI language for the password-reset email template',
    enum: ['en', 'es'],
    example: 'es',
  })
  @IsString()
  @IsIn(['en', 'es'])
  language: 'en' | 'es';
}
