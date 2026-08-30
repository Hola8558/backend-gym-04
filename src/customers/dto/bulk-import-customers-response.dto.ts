import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class BulkImportCustomerResultDto {
  @Expose()
  @ApiProperty()
  index: number;

  @Expose()
  @ApiProperty()
  success: boolean;

  @Expose()
  @ApiPropertyOptional()
  user_number?: string | null;

  @Expose()
  @ApiPropertyOptional()
  email?: string | null;

  @Expose()
  @ApiPropertyOptional()
  error?: string;
}

export class BulkImportCustomersResponseDto {
  @Expose()
  @ApiProperty()
  total: number;

  @Expose()
  @ApiProperty()
  created: number;

  @Expose()
  @ApiProperty()
  failed: number;

  @Expose()
  @ApiProperty({ type: [BulkImportCustomerResultDto] })
  @Type(() => BulkImportCustomerResultDto)
  results: BulkImportCustomerResultDto[];
}
