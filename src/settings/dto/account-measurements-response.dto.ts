import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AccountMeasurementItemDto } from './account-measurement-item.dto';

export class AccountMeasurementsResponseDto {
  @Expose()
  @Type(() => AccountMeasurementItemDto)
  @ApiProperty({ type: [AccountMeasurementItemDto] })
  measurements!: AccountMeasurementItemDto[];
}
