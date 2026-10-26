import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class MetricFieldDto {
  @Expose()
  @ApiProperty({ example: 'cintura' })
  key: string;

  @Expose()
  @ApiProperty({ example: 'Cintura' })
  label: string;

  @Expose()
  @ApiProperty({ example: 'length', enum: ['weight', 'length', 'percentage'] })
  unit_type: string;

  @Expose()
  @ApiProperty({ example: 'cm' })
  unit: string;
}
