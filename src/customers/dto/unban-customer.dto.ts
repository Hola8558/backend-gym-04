import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { RecoverCustomerDto } from './recover-customer.dto';

export class UnbanCustomerDto extends RecoverCustomerDto {
  @ApiProperty({ description: 'Reason for lifting the ban (audit trail).' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  liftReason: string;
}
