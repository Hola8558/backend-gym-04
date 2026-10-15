import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import type { KioskMembershipStatus } from '../types/kiosk-membership-status.type';

/** Kiosk-safe customer row: no email, no full last name, masked user number. */
export class KioskCustomerResultDto {
  @Expose()
  @ApiProperty()
  idUser: number;

  @Expose()
  @ApiProperty({ example: 'Juan P.' })
  displayName: string;

  @Expose()
  @ApiProperty({ example: '•••93' })
  maskedNumber: string;

  @Expose()
  @ApiProperty({ enum: ['active', 'expired', 'none'] })
  membershipStatus: KioskMembershipStatus;
}
