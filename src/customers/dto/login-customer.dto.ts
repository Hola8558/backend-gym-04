import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginCustomerDto {
  @ApiProperty({
    description: 'Customer email address or numeric user_number',
    example: '48291',
  })
  @IsString()
  @IsNotEmpty()
  identifier!: string;
}
