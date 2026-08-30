import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateRoutineDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_user: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  week: number;

  @ApiPropertyOptional({ type: 'array', nullable: true })
  @IsOptional()
  @IsArray()
  Lun?: unknown[] | null;

  @ApiPropertyOptional({ type: 'array', nullable: true })
  @IsOptional()
  @IsArray()
  Mar?: unknown[] | null;

  @ApiPropertyOptional({ type: 'array', nullable: true })
  @IsOptional()
  @IsArray()
  Mie?: unknown[] | null;

  @ApiPropertyOptional({ type: 'array', nullable: true })
  @IsOptional()
  @IsArray()
  Jue?: unknown[] | null;

  @ApiPropertyOptional({ type: 'array', nullable: true })
  @IsOptional()
  @IsArray()
  Vie?: unknown[] | null;

  @ApiPropertyOptional({ type: 'array', nullable: true })
  @IsOptional()
  @IsArray()
  Sab?: unknown[] | null;

  @ApiPropertyOptional({ type: 'array', nullable: true })
  @IsOptional()
  @IsArray()
  Dom?: unknown[] | null;

  @ApiPropertyOptional({
    description: 'ISO timestamp of last successful WhatsApp send',
    example: '2026-08-13T22:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  last_msg_sent?: string;
}
