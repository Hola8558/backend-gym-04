import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUrl, Min, MinLength } from 'class-validator';

export class SaveMediaResourceDto {
  @ApiPropertyOptional({ description: 'Existing media id; omit for new items' })
  @IsOptional()
  @IsInt()
  @Min(1)
  idResourcesMedia?: number;

  @ApiProperty({ example: 'Warm-up video' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ example: 'https://example.com/videos/warm-up' })
  @IsString()
  @IsUrl({ require_protocol: true })
  url!: string;
}
