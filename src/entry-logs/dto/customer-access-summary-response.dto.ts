import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenericStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { Expose } from 'class-transformer';
import { CustomerAccessLogItemDto } from './customer-access-log-item.dto';

export class CustomerAccessSummaryResponseDto {
  @Expose()
  @ApiProperty()
  idUser: number;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  userNumber: string | null;

  @Expose()
  @ApiProperty()
  fullName: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  emergencyPhone: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  membershipPlanName: string | null;

  @Expose()
  @ApiPropertyOptional({ enum: GenericStatus, nullable: true })
  membershipStatus: GenericStatus | null;

  @Expose()
  @ApiProperty({ type: [CustomerAccessLogItemDto] })
  @Type(() => CustomerAccessLogItemDto)
  entries: CustomerAccessLogItemDto[];
}
