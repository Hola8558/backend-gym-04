import { ApiProperty } from '@nestjs/swagger';
import { GenericStatus } from '@prisma/client';
import { Expose } from 'class-transformer';

/**
 * Safe membership-plan shape for API responses (no internal account or timestamps).
 */
export class MembershipTypeResponseDto {
  @Expose()
  @ApiProperty({ description: 'Tenant-scoped plan id' })
  id_membership_type: number;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  duration_days: number;

  @Expose()
  @ApiProperty()
  price: string;

  @Expose()
  @ApiProperty({ required: false, nullable: true })
  features: string | null;

  @Expose()
  @ApiProperty({ enum: GenericStatus })
  status: GenericStatus;
}
