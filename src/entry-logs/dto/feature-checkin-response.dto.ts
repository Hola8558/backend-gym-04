import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class FeatureCheckinResponseDto {
  @Expose()
  @ApiProperty({ example: true })
  success!: boolean;

  @Expose()
  @ApiProperty({
    description: 'Whether feature 5001 (check-in) is active for the customer gym account',
  })
  isEnabled!: boolean;
}
