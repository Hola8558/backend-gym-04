import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class IngredientResponseDto {
  @Expose()
  @ApiProperty()
  id_ingredient: number;

  @Expose()
  @ApiProperty({ nullable: true })
  name_es: string | null;

  @Expose()
  @ApiProperty({ nullable: true })
  name_en: string | null;

  @Expose()
  @ApiProperty({ nullable: true })
  emoji: string | null;

  @Expose()
  @ApiProperty({ nullable: true })
  fat_100g: number | null;

  @Expose()
  @ApiProperty({ nullable: true })
  protein_100g: number | null;

  @Expose()
  @ApiProperty({ nullable: true })
  carbs_100g: number | null;

  @Expose()
  @ApiProperty({ nullable: true })
  kcal_per_100g: number | null;

  @Expose()
  @ApiProperty({ nullable: true })
  weight_per_unit: number | null;

  /** True when this account owns a row in original_new_ingredients for this ingredient. */
  @Expose()
  @ApiProperty()
  can_delete: boolean;
}
