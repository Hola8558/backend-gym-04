import { plainToInstance } from 'class-transformer';
import { IdentifyResponseDto } from '../dto/identify-response.dto';
import { obfuscateIdentifier } from './obfuscate-identifier.util';

export function toIdentifyResponseDto(
  requiresPasswordChange: boolean,
  identifier: string,
): IdentifyResponseDto {
  return plainToInstance(
    IdentifyResponseDto,
    {
      requires_password_change: requiresPasswordChange,
      identifier_hint: obfuscateIdentifier(identifier),
    },
    { excludeExtraneousValues: true },
  );
}
