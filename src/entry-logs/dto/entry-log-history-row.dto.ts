import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenericStatus } from '@prisma/client';
import { Expose } from 'class-transformer';

export class EntryLogHistoryRowDto {
  @Expose()
  @ApiProperty()
  idEntryLog: number;

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
  @ApiProperty()
  entryDate: Date;

  @Expose()
  @ApiProperty({ enum: GenericStatus })
  status: GenericStatus;
}
