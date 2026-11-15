import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { GLOBAL_MEASUREMENT_UNIT_TYPES } from '../../accounts/types/global-measurement.type';

export class AccountMeasurementItemDto {
  @Expose()
  @ApiProperty({ example: 'pecho' })
  key!: string;

  @Expose()
  @ApiProperty({ example: 'Pecho' })
  label!: string;

  @Expose()
  @ApiProperty({ enum: GLOBAL_MEASUREMENT_UNIT_TYPES, example: 'length' })
  unit_type!: string;

  @Expose()
  @ApiProperty({ type: String, nullable: true, example: null })
  deleted_at!: string | null;
}
