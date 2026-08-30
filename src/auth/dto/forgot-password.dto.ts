import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  ValidateIf,
} from 'class-validator';

export class ForgotPasswordDto {
  @ApiPropertyOptional({
    description: 'Plain user email address (not masked)',
    example: 'user@example.com',
  })
  @ValidateIf((dto: ForgotPasswordDto) => !dto.userNumber?.trim())
  @IsNotEmpty({ message: 'AUTH.ERRORS.FORGOT_PASSWORD_IDENTIFIER_REQUIRED' })
  @IsString()
  identifier?: string;

  @ApiPropertyOptional({
    description: 'Numeric user_number for password reset',
    example: '12345',
  })
  @ValidateIf((dto: ForgotPasswordDto) => !dto.identifier?.trim())
  @IsNotEmpty({ message: 'AUTH.ERRORS.FORGOT_PASSWORD_IDENTIFIER_REQUIRED' })
  @IsString()
  userNumber?: string;

  @ApiProperty({
    description: 'Active UI language for the password-reset email template',
    enum: ['en', 'es'],
    example: 'es',
  })
  @IsString()
  @IsIn(['en', 'es'])
  language: 'en' | 'es';
}
