import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CustomerBanHistoryEntryDto {
  @Expose()
  @ApiProperty()
  idBan: number;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  bannedAt: string;

  @Expose()
  @ApiProperty()
  bannedBy: string;

  @Expose()
  @ApiProperty()
  reason: string;

  @Expose()
  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE'] })
  status: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  liftedAt: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  liftedBy: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  liftReason: string | null;
}
