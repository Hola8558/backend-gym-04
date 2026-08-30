import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

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
}
