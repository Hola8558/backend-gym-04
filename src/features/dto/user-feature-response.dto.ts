import { ApiProperty } from '@nestjs/swagger';

export class UserFeatureResponseDto {
  @ApiProperty({
    description: 'Stable feature identifier (matches id_feature as string)',
    example: '5001',
  })
  featureKey!: string;

  @ApiProperty({ description: 'Whether the flag is active for the user' })
  value!: boolean;

  @ApiProperty()
  customizable!: boolean;

  @ApiProperty({
    required: false,
    description: 'JSON string for feature copy (titleKey / descKey)',
  })
  description?: string;
}
