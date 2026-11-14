/**
 * Privacy Utilities for Healthcare & Enterprise Compliance (HIPAA / POPIA / GDPR)
 */

export type PrivacyMode = 'FULL_NAME' | 'MASKED_NAME' | 'TICKET_ONLY';

export function applyPrivacyMask(
  name?: string | null,
  mode: string = 'FULL_NAME',
): string {
  if (!name || !name.trim()) return 'Customer';
  if (mode === 'TICKET_ONLY') return 'Customer';

  if (mode === 'MASKED_NAME') {
    const parts = name.trim().split(/\s+/);
    return parts
      .map((part) => {
        if (part.length <= 1) return part;
        if (part.length === 2) return `${part[0]}*`;
        const maskLength = Math.max(part.length - 2, 2);
        return `${part[0]}${'*'.repeat(maskLength)}${part[part.length - 1]}`;
      })
      .join(' ');
  }

  return name;
}

