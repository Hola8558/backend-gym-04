import { ApiProperty } from '@nestjs/swagger';
import { DASHBOARD_EXPORT_METRICS } from '../types/dashboard-export-metric.type';

export class DashboardExportSheetDto {
  @ApiProperty({ enum: DASHBOARD_EXPORT_METRICS })
  metric!: string;

  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
  })
  rows!: Record<string, string | number | boolean | null>[];
}

export class DashboardExportResponseDto {
  @ApiProperty({ type: [DashboardExportSheetDto] })
  sheets!: DashboardExportSheetDto[];
}
