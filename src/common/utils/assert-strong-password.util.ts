import { BadRequestException } from '@nestjs/common';

const STRONG_PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function assertStrongPassword(plain: string): string {
  const trimmed = plain.trim();
  if (trimmed.length < 8 || !STRONG_PASSWORD_PATTERN.test(trimmed)) {
    throw new BadRequestException('AUTH.ERRORS.WEAK_PASSWORD');
  }
  return trimmed;
}
