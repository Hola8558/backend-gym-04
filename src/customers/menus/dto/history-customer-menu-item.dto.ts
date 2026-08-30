import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class HistoryCustomerMenuItemDto {
  @Expose()
  @ApiProperty()
  id_menu!: number;

  @Expose()
  @ApiProperty()
  created_at!: Date;

  @Expose()
  @ApiProperty()
  updated_at!: Date;

  @Expose()
  @ApiProperty({
    description:
      'Hydrated menu plan JSON (estricto|dinamico) with tags and flat-merged ingredients',
    type: 'object',
    additionalProperties: true,
  })
  data!: Record<string, unknown>;
}
