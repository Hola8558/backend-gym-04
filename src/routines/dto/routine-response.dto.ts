import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenericStatus } from '@prisma/client';
import { Expose } from 'class-transformer';

export class RoutineResponseDto {
  @Expose()
  @ApiPropertyOptional({ nullable: true })
  name: string | null;

  @Expose()
  @ApiProperty({ type: 'object', additionalProperties: true })
  data: Record<string, unknown>;

  @Expose()
  @ApiProperty()
  created_at: Date;
}
