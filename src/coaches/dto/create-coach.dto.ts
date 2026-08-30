import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { IsCommonEmailDomain } from '../../common/decorators/is-common-email-domain.decorator';

export class CreateCoachDto {
  @ApiProperty()
  @IsEmail()
  @IsCommonEmailDomain()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  last_name: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emergency_phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;
}
