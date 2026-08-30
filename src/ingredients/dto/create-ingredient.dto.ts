import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

/** Single grapheme cluster that is an emoji (incl. ZWJ / modifiers). */
const EMOJI_ONLY_REGEX =
  /^(?:\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)*)+$/u;

export class CreateIngredientDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name_es: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name_en: string;

  @ApiProperty({ description: 'Emoji characters only' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  @Matches(EMOJI_ONLY_REGEX, {
    message: 'INGREDIENTS.ERRORS.EMOJI_INVALID',
  })
  emoji: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fat_100g: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  protein_100g: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  carbs_100g: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  kcal_per_100g: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  weight_per_unit: number;
}
