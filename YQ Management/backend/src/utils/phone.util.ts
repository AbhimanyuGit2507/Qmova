/**
 * Returns an array of legitimate phone number formats for lookups across different
 * storage conventions (+E.164, raw digits, local format with leading 0).
 * Prevents catastrophic cross-country collisions caused by arbitrary substring matching.
 */
export function getPhoneLookupVariants(rawPhone: string): string[] {
  if (!rawPhone) return [];
  const trimmed = rawPhone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return [trimmed];

  const variants = new Set<string>();
  variants.add(trimmed);
  variants.add(digits);
  variants.add(`+${digits}`);

  // South Africa format (0XXXXXXXXX <-> 27XXXXXXXXX)
  if (digits.startsWith('0') && digits.length === 10) {
    const intl = '27' + digits.slice(1);
    variants.add(intl);
    variants.add(`+${intl}`);
  } else if (digits.startsWith('27') && digits.length === 11) {
    const local = '0' + digits.slice(2);
    variants.add(local);
  }

  // India format (91XXXXXXXXXX <-> 10 digits)
  if (digits.startsWith('91') && digits.length === 12) {
    const local10 = digits.slice(2);
    variants.add(local10);
    variants.add('0' + local10);
  } else if (digits.length === 10 && !digits.startsWith('0')) {
    variants.add('91' + digits);
    variants.add('+91' + digits);
  }

  return Array.from(variants);
}

/**
 * Phone normalization utilities for South African numbers (and international fallback).
 *
 * Rules:
 *   - Local SA (0XXXXXXXXX / 10 digits) → E.164 → 27XXXXXXXXX
 *   - Already E.164 (27XXXXXXXXX)       → keep as-is
 *   - Other international formats       → keep digits
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

  // If already full international (10-15 digits), preserve as-is
  if (digits.length >= 10) {
    return digits;
  }

  // Fallback for short local SA digits
  const last9 = digits.slice(-9);
  return '27' + last9;
}

/**
 * Returns a Prisma `in` condition that matches legitimate variants of a phone number.
 * Safe for phone lookups across different storage formats without substring collisions.
 */
export function phoneMatchCondition(phone: string): { in: string[] } {
  return { in: getPhoneLookupVariants(phone) };
}
