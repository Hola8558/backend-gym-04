import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GetStyleQueryDto {
  @ApiPropertyOptional({
    description: 'Locally cached logo change key from the mobile app',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  logoKey?: string;

  @ApiPropertyOptional({
    description: 'Locally cached primary color change key from the mobile app',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  colorKey?: string;

  @ApiPropertyOptional({
    description: 'Locally cached gym name change key from the mobile app',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameKey?: string;
}
