import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AssignedCustomerRowDto {
  @Expose()
  @ApiProperty()
  id_user: number;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  name: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  lastname: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  email: string | null;
}
