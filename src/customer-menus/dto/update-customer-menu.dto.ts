import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpdateCustomerMenuDto {
  @ApiProperty({
    description: 'Full personalized menu plan JSON including tags snapshot',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  data: Record<string, unknown>;
}
