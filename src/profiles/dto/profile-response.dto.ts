import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ProfileResponseDto {
  @Expose()
  @ApiProperty({ nullable: true })
  first_name: string | null;

  @Expose()
  @ApiProperty({ nullable: true })
  last_name: string | null;

  @Expose()
  @ApiProperty({ nullable: true })
  business_name: string | null;

  @Expose()
  @ApiProperty({ nullable: true })
  email: string | null;

  @Expose()
  @ApiProperty({ nullable: true })
  phone: string | null;

  @Expose()
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  registration_date: string | null;

  @Expose()
  @ApiProperty({ enum: UserRole })
  role: UserRole;
}
