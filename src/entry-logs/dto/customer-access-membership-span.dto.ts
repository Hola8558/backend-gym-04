import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/** One non-deleted membership drawn on the customer attendance calendar. */
export class CustomerAccessMembershipSpanDto {
  @Expose()
  @ApiProperty({ type: String, format: 'date' })
  start_date: string;

  @Expose()
  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  end_date: string | null;
}
