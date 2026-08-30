import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { BulkImportCustomersDto } from './dto/bulk-import-customers.dto';
import { BulkImportCustomersResponseDto } from './dto/bulk-import-customers-response.dto';
import { coerceBulkImportCustomerRow } from './utils/coerce-bulk-import-customer-row.util';
import { UsersService } from '../users/users.service';

@Injectable()
export class CustomersImportService {
  constructor(private readonly usersService: UsersService) {}

  async bulkImportCustomers(
    id_account: number,
    current_user_id: number,
    dto: BulkImportCustomersDto,
  ): Promise<BulkImportCustomersResponseDto> {
    const rows = dto.customers ?? [];
    const results = [];

    for (let index = 0; index < rows.length; index++) {
      const coerced = coerceBulkImportCustomerRow(rows[index], index);

      try {
        const created = await this.usersService.createCustomerFromBulkImport(
          id_account,
          coerced,
          current_user_id,
        );

        if (created) {
          results.push({
            index,
            success: true,
            user_number: created.user_number,
            email: created.email,
          });
          continue;
        }

        results.push({
          index,
          success: false,
          error: 'CUSTOMERS.IMPORT.ERRORS.ROW_CREATE_FAILED',
        });
      } catch {
        results.push({
          index,
          success: false,
          error: 'CUSTOMERS.IMPORT.ERRORS.ROW_CREATE_FAILED',
        });
      }
    }

    const created = results.filter((row) => row.success).length;

    return plainToInstance(
      BulkImportCustomersResponseDto,
      {
        total: rows.length,
        created,
        failed: rows.length - created,
        results,
      },
      { excludeExtraneousValues: true },
    );
  }
}
