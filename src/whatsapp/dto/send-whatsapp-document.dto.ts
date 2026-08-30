import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class SendWhatsappDocumentDto {
  @ApiProperty({
    description: 'Recipient phone digits including country code (no +)',
    example: '5215512345678',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{8,20}$/)
  phone: string;

  @ApiProperty({ example: 'menu_4.pdf' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  fileName: string;

  @ApiProperty({
    description: 'PDF as Base64 (raw or data URL)',
  })
  @IsString()
  @IsNotEmpty()
  mediaBase64: string;

  @ApiPropertyOptional({ example: 'Your weekly menu' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  caption?: string;
}
