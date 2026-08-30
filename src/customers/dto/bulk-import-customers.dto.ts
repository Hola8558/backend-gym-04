import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { BulkImportCustomerRowDto } from './bulk-import-customer-row.dto';

export class BulkImportCustomersDto {
  @ApiProperty({ type: [BulkImportCustomerRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkImportCustomerRowDto)
  customers: BulkImportCustomerRowDto[];
}
