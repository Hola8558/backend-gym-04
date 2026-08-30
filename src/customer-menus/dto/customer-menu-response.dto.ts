import { ApiProperty } from '@nestjs/swagger';
import { GenericStatus } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class CustomerMenuResponseDto {
  @Expose()
  @ApiProperty()
  id_menu: number;

  @Expose()
  @ApiProperty()
  id_user: number;

  @Expose()
  @ApiProperty()
  created_at: Date;

  @Expose()
  @ApiProperty()
  updated_at: Date;

  @Expose()
  @ApiProperty({ enum: GenericStatus })
  status: GenericStatus;

  @Expose()
  @ApiProperty({ type: 'object', additionalProperties: true })
  data: Record<string, unknown>;
}
