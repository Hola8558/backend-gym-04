import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class LatestClientMetricDto {
  @Expose()
  @ApiProperty({ format: 'uuid' })
  id_measure: string;

  @Expose()
  @ApiProperty({ example: '2026-10-24' })
  date: string;

  @Expose()
  @ApiProperty({ example: 72.4, nullable: true })
  weight: number | null;

  @Expose()
  @ApiProperty({ example: { cintura: 80 } })
  measurements: Record<string, number>;

  @Expose()
  @ApiProperty({ nullable: true, example: null })
  edited_at: string | null;
}
