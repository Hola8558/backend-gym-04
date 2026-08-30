import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsInt, IsNumber, Min } from 'class-validator';

export class ItemIngredienteDto {
  @Expose()
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ingrediente_id: number;

  @Expose()
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  gramos: number;
}
