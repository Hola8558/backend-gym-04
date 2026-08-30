import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CustomerResponseDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  user_number: string | null;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  lastname: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  email: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  phone: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  emergency_phone: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  observations: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  activeMembershipName: string | null;

  @Expose()
  @ApiPropertyOptional({
    nullable: true,
    description:
      'Active customer_membership.id_membership_type for renew / pre-select flows.',
  })
  membership_type_id: number | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true, type: String, format: 'date' })
  birthdate: string | null;

  @Expose()
  @ApiProperty()
  active_routines_count: number;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  assignedCoachName: string | null;

  @Expose()
  @ApiProperty()
  status: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  created_at: Date | null;
}
