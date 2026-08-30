import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsObject, Min } from 'class-validator';

export class CreateCustomerMenuDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_user: number;

  @ApiProperty({
    description: 'Full personalized menu plan JSON including tags snapshot',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  data: Record<string, unknown>;
}
