import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class HealthPreferencesResponseDto {
  @Expose()
  @ApiProperty({
    type: [String],
    example: ['alergias', 'lesiones', 'disgustos-deleted'],
  })
  preferences!: string[];
}
