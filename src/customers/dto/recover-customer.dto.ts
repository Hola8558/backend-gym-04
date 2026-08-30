import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export enum CustomerRecoveryTypeDto {
  RESTORE = 'RESTORE',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class RecoverCustomerDto {
  @ApiProperty({ enum: CustomerRecoveryTypeDto })
  @IsEnum(CustomerRecoveryTypeDto)
  recoveryType: CustomerRecoveryTypeDto;

  @ApiPropertyOptional({
    description:
      'Required when recoveryType is ACTIVE: assigns a new billing cycle. Ignored for RESTORE and INACTIVE.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  membershipId?: number;
}
