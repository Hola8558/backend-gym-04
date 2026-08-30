import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ActiveCustomerMenuResponseDto {
  @Expose()
  @ApiProperty()
  created_at: Date;

  @Expose()
  @ApiProperty()
  updated_at: Date;

  @Expose()
  @ApiProperty({
    description:
      'Menu plan JSON (estricto|dinamico) with kind=ingredient rows flat-merged from ingredients table',
    type: 'object',
    additionalProperties: true,
  })
  data: Record<string, unknown>;
}
