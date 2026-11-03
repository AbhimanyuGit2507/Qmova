/**
 * Phone normalization utilities for South African numbers (and international fallback).
 *
 * Rules:
 *   - Local SA (0XXXXXXXXX / 10 digits) → E.164 → 27XXXXXXXXX
 *   - Already E.164 (27XXXXXXXXX)       → keep as-is
 *   - Unknown prefix / short            → prepend 27, take last 9 digits
 */
export function normalizePhoneZA(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  // Local SA format: starts with 0 and is 10 digits
  if (digits.startsWith('0') && digits.length === 10) {
    return '27' + digits.slice(1);
  }

  // Already E.164 international
  if (digits.startsWith('27') && digits.length >= 11) {
    return digits;
  }

  // Fallback: take last 9 significant digits and prepend 27
  const last9 = digits.slice(-9);
  return '27' + last9;
}

/**
 * Returns a Prisma `contains` condition that matches the last 9 digits of a phone.
 * Safe for fuzzy phone lookups across different storage formats.
 */
export function phoneMatchCondition(phone: string): { contains: string } {
  const normalized = normalizePhoneZA(phone);
  const last9 = normalized.slice(-9);
  return { contains: last9 };
}
