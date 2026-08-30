import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DeletedCustomerResponseDto {
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
  activeMembershipName: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  membership_type_id: number | null;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  deleted_at: string;

  @Expose()
  @ApiPropertyOptional({
    nullable: true,
    description: 'Display name of the coach/owner who performed the soft delete.',
  })
  deletedBy: string | null;

  @Expose()
  @ApiProperty()
  status: string;
}
