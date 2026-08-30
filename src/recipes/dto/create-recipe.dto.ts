import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ItemIngredienteDto } from './item-ingrediente.dto';

export class CreateRecipeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fat: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  protein: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  carb: number;

  @ApiProperty({ type: [Number] })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  ingredients: number[];

  @ApiProperty({ type: [ItemIngredienteDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemIngredienteDto)
  ingredientes_cantidades?: ItemIngredienteDto[];
}
