import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AppearanceResponseDto {
  @Expose()
  @ApiProperty({ example: '#0061A4', nullable: true })
  primaryColor: string | null;

  @Expose()
  @ApiProperty({ nullable: true, description: 'Base64 data URL gym logo' })
  logo: string | null;

  @Expose()
  @ApiProperty({ nullable: true, description: 'Base64 data URL favicon' })
  favicon: string | null;

  @Expose()
  @ApiProperty({ example: 'Tlakani', nullable: true })
  gymName: string | null;

  @Expose()
  @ApiProperty({
    example: 300,
    nullable: true,
    description: 'Gym maximum capacity. Null when feature 5001 is not enabled.',
  })
  maxCapacity: number | null;

  @Expose()
  @ApiProperty({ nullable: true, description: 'Cache invalidation token for logo' })
  logoKeyChange: string | null;

  @Expose()
  @ApiProperty({ nullable: true, description: 'Cache invalidation token for primary color' })
  colorKeyChange: string | null;

  @Expose()
  @ApiProperty({ nullable: true, description: 'Cache invalidation token for gym name' })
  nameKeyChange: string | null;
}
