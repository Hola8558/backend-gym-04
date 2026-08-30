import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class CustomerMenuCountResponseDto {
  @Expose()
  @ApiProperty()
  id_user: number;

  @Expose()
  @ApiProperty({
    description: 'Count of non-deleted (active) menus for this customer',
  })
  count: number;
}
