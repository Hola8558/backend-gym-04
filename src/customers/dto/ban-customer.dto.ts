import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class BanCustomerDto {
  @ApiProperty({ description: 'Reason for banning the customer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  reason: string;
}
