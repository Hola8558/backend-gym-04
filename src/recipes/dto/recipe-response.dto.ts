import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { ItemIngredienteDto } from './item-ingrediente.dto';

@Exclude()
export class RecipeResponseDto {
  @Expose()
  @ApiProperty()
  id_recipie: number;

  @Expose()
  @ApiProperty({ nullable: true })
  id_account: number | null;

  @Expose()
  @ApiProperty({ nullable: true })
  name: string | null;

  @Expose()
  @ApiProperty({ nullable: true })
  fat: number | null;

  @Expose()
  @ApiProperty({ nullable: true })
  protein: number | null;

  @Expose()
  @ApiProperty({ nullable: true })
  carb: number | null;

  @Expose()
  @ApiProperty({ type: [Number] })
  ingredients: number[];

  @Expose()
  @ApiProperty({ type: [ItemIngredienteDto], required: false })
  @Type(() => ItemIngredienteDto)
  ingredientes_cantidades?: ItemIngredienteDto[];

  @Expose()
  @ApiProperty({
    description:
      'Public viewer URL, e.g. https://images-viewer….workers.dev/recipes/recipe_{id}.webp',
  })
  url_image: string;
}
