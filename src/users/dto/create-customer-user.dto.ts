import { ApiPropertyOptional } from '@nestjs/swagger';
import { OmitType } from '@nestjs/mapped-types';
import { IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class CreateCustomerUserDto extends OmitType(CreateUserDto, [
  'role',
  'password',
] as const) {
  /**
   * Optional: omit to use the generated `user_number` as the initial password (hashed server-side).
   */
  @ApiPropertyOptional({ minLength: 8 })
  @IsOptional()
  @ValidateIf(
    (_, v) => v !== undefined && v !== null && String(v).trim().length > 0,
  )
  @IsString()
  @MinLength(8)
  password?: string;
}
