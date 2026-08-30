import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class StyleResponseDto {
  @Expose()
  @ApiProperty({
    nullable: true,
    description: 'Base64 data URL gym logo; null when unchanged on client',
    example: 'data:image/png;base64,iVBORw0KGgo...',
  })
  logo: string | null;

  @Expose()
  @ApiProperty({
    nullable: true,
    description: 'Logo cache invalidation token; null when unchanged on client',
  })
  logoKey: string | null;

  @Expose()
  @ApiProperty({
    example: '#0061A4',
    nullable: true,
    description: 'Primary brand color; null when unchanged on client',
  })
  primaryColor: string | null;

  @Expose()
  @ApiProperty({
    nullable: true,
    description: 'Primary color cache invalidation token; null when unchanged on client',
  })
  colorKey: string | null;

  @Expose()
  @ApiProperty({
    example: 'Tlakani',
    nullable: true,
    description: 'Gym display name; null when unchanged on client',
  })
  gymName: string | null;

  @Expose()
  @ApiProperty({
    nullable: true,
    description: 'Gym name cache invalidation token; null when unchanged on client',
  })
  nameKey: string | null;
}
