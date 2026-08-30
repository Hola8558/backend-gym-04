import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DeleteRecipeResponseDto {
  @Expose()
  @ApiProperty({ example: true })
  success: boolean;
}
