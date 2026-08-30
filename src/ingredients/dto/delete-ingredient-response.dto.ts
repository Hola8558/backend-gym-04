import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DeleteIngredientResponseDto {
  @Expose()
  @ApiProperty()
  success: boolean;
}
