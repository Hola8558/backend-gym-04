import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { QuickAccessEntry } from '../utils/quick-access.util';

export class QuickAccessResponseDto {
  @Expose()
  @ApiProperty({ example: 'customers.active' })
  view!: string;

  @Expose()
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  entries!: QuickAccessEntry[];

  @Expose()
  @ApiProperty({ type: [String] })
  shortcutIds!: string[];

  @Expose()
  @ApiProperty({ example: 0 })
  shortcutCount!: number;
}
