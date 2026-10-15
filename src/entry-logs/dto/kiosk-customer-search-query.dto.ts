import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import {
  KIOSK_SEARCH_MAX_QUERY_LENGTH,
  KIOSK_SEARCH_MIN_QUERY_LENGTH,
} from '../constants/kiosk-search.const';

export class KioskCustomerSearchQueryDto {
  @ApiProperty({ description: 'Name, last name or email prefix', example: 'jua pe' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(KIOSK_SEARCH_MIN_QUERY_LENGTH, {
    message: 'ENTRY_LOGS.ERRORS.SEARCH_TOO_SHORT',
  })
  @MaxLength(KIOSK_SEARCH_MAX_QUERY_LENGTH)
  q: string;
}
