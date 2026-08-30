import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ManualCheckinDto {
  @ApiProperty({ example: '482-917', description: 'Daily gym kiosk access code (XXX-XXX)' })
  @IsString()
  @IsNotEmpty()
  accessCode!: string;

  @ApiProperty({ example: '12345' })
  @IsString()
  @IsNotEmpty()
  userNumber!: string;

  @ApiProperty({ example: '2026-05-28', description: 'Check-in date from the client' })
  @IsString()
  @IsNotEmpty()
  date!: string;

  @ApiProperty({ example: '14:30:00', description: 'Check-in time from the client' })
  @IsString()
  @IsNotEmpty()
  time!: string;
}
