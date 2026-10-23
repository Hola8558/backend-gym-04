import { HealthPreferencesResponseDto } from '../dto/health-preferences-response.dto';

export function toHealthPreferencesResponseDto(
  preferences: string[],
): HealthPreferencesResponseDto {
  return Object.assign(new HealthPreferencesResponseDto(), { preferences });
}
