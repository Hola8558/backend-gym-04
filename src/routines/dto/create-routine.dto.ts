import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CreateRoutineDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_user?: number;

  @ApiPropertyOptional()
  @ValidateIf((o) => o.id_user == null || o.name !== undefined)
  @IsString()
  @ValidateIf((o) => o.id_user == null)
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsNotEmpty()
  @IsObject()
  data: Record<string, unknown>;
}
