import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class BannedCustomerResponseDto {
  @Expose()
  @ApiProperty({ description: 'CustomerBan primary key (for audit / history UI).' })
  idBan!: number;

  @Expose()
  @ApiProperty()
  id!: number;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  user_number!: string | null;

  @Expose()
  @ApiProperty()
  name!: string;

  @Expose()
  @ApiProperty()
  lastname!: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  bannedAt!: string;

  @Expose()
  @ApiProperty()
  reason!: string;

  @Expose()
  @ApiProperty()
  bannedBy!: string;

  /** CustomerBan.status (BanStatus): ACTIVE | INACTIVE (inactive = lifted in UI). */
  @Expose()
  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE'], description: 'Ban row status' })
  status!: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true, description: 'Current membership type id for recovery dialog' })
  membership_type_id!: number | null;
}
