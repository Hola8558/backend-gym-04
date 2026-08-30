import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class MediaResourceResponseDto {
  @Expose()
  @ApiProperty()
  idResourcesMedia!: number;

  @Expose()
  @ApiProperty()
  title!: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @Expose()
  @ApiProperty()
  url!: string;

  @Expose()
  @ApiProperty()
  createdAt!: string;

  @Expose()
  @ApiProperty()
  editedAt!: string;
}
