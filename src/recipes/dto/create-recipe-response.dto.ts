import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class CreateRecipeResponseDto {
  @Expose()
  @ApiProperty()
  id_recipie: number;

  @Expose()
  @ApiProperty({
    description:
      'Presigned R2 PutObject URL for recipes/recipe_{id}.webp',
  })
  upload_url: string;
}
