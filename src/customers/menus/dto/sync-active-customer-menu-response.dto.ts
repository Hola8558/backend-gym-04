import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SyncActiveCustomerMenuResponseDto {
  @Expose()
  @ApiProperty({
    description:
      'true when client created_at + updated_at match the newest non-deleted menu',
  })
  isUpToDate!: boolean;

  @Expose()
  @ApiPropertyOptional({
    description: 'Present when isUpToDate is false',
  })
  created_at?: Date;

  @Expose()
  @ApiPropertyOptional({
    description: 'Last update of the menu (same as updated_at). Present when isUpToDate is false',
  })
  updated_at?: Date;

  @Expose()
  @ApiPropertyOptional({
    description:
      'Hydrated menu plan JSON. Present when isUpToDate is false',
    type: 'object',
    additionalProperties: true,
  })
  data?: Record<string, unknown>;
}
