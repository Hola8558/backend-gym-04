import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Tlakani Gym',
    description: 'Gym or business display name',
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'PROFILE.ERRORS.INVALID_BUSINESS_NAME' })
  @MaxLength(120, { message: 'PROFILE.ERRORS.INVALID_BUSINESS_NAME' })
  business_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: 'PROFILE.ERRORS.INVALID_EMAIL' })
  email?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(40, { message: 'PROFILE.ERRORS.INVALID_PHONE' })
  phone?: string;
}
