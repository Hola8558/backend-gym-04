import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CustomerResponseDto {
  @Expose()
  @ApiProperty()
  id: number;

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
  @ApiProperty()
  status: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  created_at: Date | null;
}
