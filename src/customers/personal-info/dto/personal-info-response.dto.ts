import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PersonalInfoResponseDto {
  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  user_number!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone_number!: string | null;

  @ApiPropertyOptional({ nullable: true })
  emergency_phone_number!: string | null;
}
