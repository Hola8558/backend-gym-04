import { plainToInstance } from 'class-transformer';
import { SoftDeleteAccountResponseDto } from '../dto/soft-delete-account-response.dto';
import type { SoftDeleteAccountResult } from '../types/soft-delete-account-result.type';

export function toSoftDeleteAccountResponseDto(
  result: SoftDeleteAccountResult,
): SoftDeleteAccountResponseDto {
  return plainToInstance(SoftDeleteAccountResponseDto, result, {
    excludeExtraneousValues: true,
  });
}
