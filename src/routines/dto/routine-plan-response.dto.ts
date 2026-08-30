import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenericStatus } from '@prisma/client';
import { Expose } from 'class-transformer';

export class RoutinePlanResponseDto {
  @Expose()
  @ApiProperty()
  id_routine: number;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  name: string | null;

  @Expose()
  @ApiProperty({ type: 'object', additionalProperties: true })
  data: Record<string, unknown>;

  @Expose()
  @ApiProperty({ enum: GenericStatus })
  status: GenericStatus;

  @Expose()
  @ApiProperty()
  created_at: Date;

  @Expose()
  @ApiProperty()
  edited_at: Date;
}
