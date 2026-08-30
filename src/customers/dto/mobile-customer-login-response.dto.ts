import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MobileRoutineItemDto } from './mobile-routine-item.dto';

export class MobileCustomerLoginCustomerDto {
  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  userNumber!: string | null;

  @ApiProperty({ description: 'Obfuscated email for privacy' })
  email!: string;

  @ApiProperty({
    nullable: true,
    type: MobileRoutineItemDto,
    isArray: true,
    description:
      'Active routines with id_routine, edited_at, and hydrated weekly plan data',
  })
  routineData!: MobileRoutineItemDto[] | null;

  @ApiPropertyOptional({
    description:
      'Present and true when the account exposes memberships (gym, or solo coach with feature 5006). Omitted for solo coach without 5006.',
  })
  membershipAvailable?: boolean;
}

export class MobileCustomerLoginResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ type: MobileCustomerLoginCustomerDto })
  customer!: MobileCustomerLoginCustomerDto;
}
