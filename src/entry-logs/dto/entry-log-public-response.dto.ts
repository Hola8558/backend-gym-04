import { ApiProperty } from '@nestjs/swagger';
import { GenericStatus } from '@prisma/client';
import { Expose } from 'class-transformer';

/** Entry log fields safe to expose to clients (no internal DB ids). */
export class EntryLogPublicResponseDto {
  @Expose()
  @ApiProperty()
  entryDate: Date;

  @Expose()
  @ApiProperty({ enum: GenericStatus })
  status: GenericStatus;

  @Expose()
  @ApiProperty({
    description: 'Customer display name for kiosk UI (profile or user number fallback)',
  })
  customerName: string;
}
