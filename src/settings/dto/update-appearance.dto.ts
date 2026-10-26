import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UNIT_SYSTEMS } from '../../accounts/types/unit-system.type';

export class UpdateAppearanceDto {
  @ApiProperty({
    nullable: true,
    description: 'Base64 data URL gym logo; null when unchanged',
  })
  @ValidateIf((dto: UpdateAppearanceDto) => dto.logo !== null)
  @IsString()
  @MaxLength(6_000_000)
  logo: string | null;

  @ApiProperty({
    nullable: true,
    example: 'Tlakani',
    description: 'Gym display name; null when unchanged',
  })
  @ValidateIf((dto: UpdateAppearanceDto) => dto.name !== null)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string | null;

  @ApiProperty({
    nullable: true,
    example: '#0061A4',
    description: 'Primary brand color; null when unchanged',
  })
  @ValidateIf((dto: UpdateAppearanceDto) => dto.color !== null)
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'SETTINGS.ERRORS.INVALID_PRIMARY_COLOR',
  })
  color: string | null;

  @ApiProperty({
    nullable: true,
    description: 'Base64 data URL favicon; null when unchanged',
  })
  @ValidateIf((dto: UpdateAppearanceDto) => dto.favicon !== null)
  @IsString()
  @MaxLength(6_000_000)
  favicon: string | null;

  @ApiProperty({
    required: false,
    example: 300,
    description: 'Gym maximum capacity; omit when unchanged',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxCapacity?: number;

  @ApiProperty({
    required: false,
    enum: UNIT_SYSTEMS,
    example: 'metric',
    description: 'Body weight and measurement units; omit when unchanged',
  })
  @IsOptional()
  @IsIn(UNIT_SYSTEMS, { message: 'SETTINGS.ERRORS.INVALID_UNIT_SYSTEM' })
  unitSystem?: (typeof UNIT_SYSTEMS)[number];
}
