export function normalizeToE164(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10 && digits.startsWith('0')) {
    return `+63${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith('63')) {
    return `+${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('63')) {
    return `+${digits}`;
  }
  return null;
}

export function isValidPHMobile(e164: string): boolean {
  return /^\+639\d{9}$/.test(e164);
}
