import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { EntryLogPublicResponseDto } from './entry-log-public-response.dto';

/** Check-in by search result: also returns the user number so the kiosk can teach the shortcut. */
export class KioskCheckinResponseDto extends EntryLogPublicResponseDto {
  @Expose()
  @ApiProperty({ nullable: true })
  userNumber: string | null;
}
