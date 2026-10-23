import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { QuickAccessFilters } from '../utils/quick-access.util';

export class QuickAccessShortcutsResponseDto {
  @Expose()
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  shortcuts!: Array<{
    id: string;
    view: string;
    name: string;
    filters: QuickAccessFilters;
  }>;
}
