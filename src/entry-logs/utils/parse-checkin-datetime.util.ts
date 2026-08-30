import { BadRequestException } from '@nestjs/common';

/**
 * Combines client-supplied date and time strings into one `Date`.
 * Accepts ISO-like `date` (YYYY-MM-DD) and `time` (HH:mm or HH:mm:ss).
 */
export function parseCheckinDateTime(date: string, time: string): Date {
  const datePart = date.trim();
  const timePart = time.trim();

  if (!datePart.length || !timePart.length) {
    throw new BadRequestException('ACCESS.ERRORS.INVALID_CHECKIN_DATETIME');
  }

  const normalizedTime = timePart.length === 5 ? `${timePart}:00` : timePart;
  const parsed = new Date(`${datePart}T${normalizedTime}`);

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException('ACCESS.ERRORS.INVALID_CHECKIN_DATETIME');
  }

  return parsed;
}

/** Normalizes kiosk codes for comparison (trim, uppercase not applied — digits only). */
export function normalizeAccessCode(value: string): string {
  return value.trim().replace(/\s+/g, '');
}
