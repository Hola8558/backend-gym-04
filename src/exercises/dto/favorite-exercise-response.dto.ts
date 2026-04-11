import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class FavoriteExerciseResponseDto {
  @Expose()
  @ApiProperty()
  id_exercise: number;

  @Expose()
  @ApiProperty()
  favorited: boolean;
}
