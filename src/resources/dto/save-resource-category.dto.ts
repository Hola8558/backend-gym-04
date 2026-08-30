import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { SaveMediaResourceDto } from './save-media-resource.dto';

export class SaveResourceCategoryDto {
  @ApiPropertyOptional({ description: 'Existing category id; omit for new categories' })
  @IsOptional()
  @IsInt()
  @Min(1)
  idResourcesCategories?: number;

  @ApiProperty({ example: 'Nutrition' })
  @IsString()
  @MinLength(1)
  categoryName!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ type: SaveMediaResourceDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveMediaResourceDto)
  resources!: SaveMediaResourceDto[];
}
