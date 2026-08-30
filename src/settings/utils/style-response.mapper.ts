import { plainToInstance } from 'class-transformer';
import { StyleResponseDto } from '../dto/style-response.dto';

export type StyleRecord = {
  logo: string | null;
  logoKey: string | null;
  primaryColor: string | null;
  colorKey: string | null;
  gymName: string | null;
  nameKey: string | null;
};

export function toStyleResponseDto(record: StyleRecord): StyleResponseDto {
  return plainToInstance(StyleResponseDto, record, {
    excludeExtraneousValues: true,
  });
}
