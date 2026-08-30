import { plainToInstance } from 'class-transformer';
import { AppearanceResponseDto } from '../dto/appearance-response.dto';

export type AppearanceRecord = {
  primaryColor: string | null;
  logo: string | null;
  favicon: string | null;
  gymName: string | null;
  maxCapacity: number | null;
  logoKeyChange: string | null;
  colorKeyChange: string | null;
  nameKeyChange: string | null;
};

export function toAppearanceResponseDto(
  record: AppearanceRecord,
): AppearanceResponseDto {
  return plainToInstance(AppearanceResponseDto, record, {
    excludeExtraneousValues: true,
  });
}
