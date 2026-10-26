import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateClientMetricDto {
  @ApiProperty({ example: '2026-10-24' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'CUSTOMERS.METRICS.ERRORS.INVALID_DATE',
  })
  date: string;

  @ApiPropertyOptional({ example: 72.4, nullable: true })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'CUSTOMERS.METRICS.ERRORS.INVALID_VALUE' },
  )
  @Min(0, { message: 'CUSTOMERS.METRICS.ERRORS.INVALID_VALUE' })
  @Max(999.99, { message: 'CUSTOMERS.METRICS.ERRORS.INVALID_VALUE' })
  weight?: number | null;

  @ApiPropertyOptional({ example: { cintura: 80, grasa_corporal: 18 }, nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsObject({ message: 'CUSTOMERS.METRICS.ERRORS.INVALID_VALUE' })
  measurements?: Record<string, unknown> | null;
}
