import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { MediaResourceResponseDto } from './media-resource-response.dto';

export class ResourceCategoryResponseDto {
  @Expose()
  @ApiProperty()
  idResourcesCategories!: number;

  @Expose()
  @ApiProperty()
  categoryName!: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @Expose()
  @ApiProperty()
  createdAt!: string;

  @Expose()
  @ApiProperty()
  editedAt!: string;

  @Expose()
  @Type(() => MediaResourceResponseDto)
  @ApiProperty({ type: MediaResourceResponseDto, isArray: true })
  resources!: MediaResourceResponseDto[];
}
