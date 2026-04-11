import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class AddFavoriteExerciseDto {
  @Type(() => Number)
  @IsInt()
  id_exercise: number;
}
