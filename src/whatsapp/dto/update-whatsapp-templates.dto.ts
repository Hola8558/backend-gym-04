import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateWhatsappTemplatesDto {
  @ApiPropertyOptional({
    description: 'Menu WhatsApp caption template (emojis stored as-is)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  menuTemplate?: string;

  @ApiPropertyOptional({
    description: 'Routine WhatsApp caption template (emojis stored as-is)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  routineTemplate?: string;
}
