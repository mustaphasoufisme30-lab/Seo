export const PAYHIP_CHECKOUT_URL = 'https://payhip.com/b/MjGi5';

export const VALID_KEYS = ['MAHFOUD-DEMO-2026', 'MAHFOUD-TEST-1234'];

export interface LicenseValidationResult {
  valid: boolean;
  message: string;
  normalizedKey?: string;
}

export function validateLicenseKey(rawKey: string): LicenseValidationResult {
  const normalizedKey = String(rawKey || '').trim().toUpperCase();

  if (
    !normalizedKey.startsWith('MAHFOUD-') ||
    normalizedKey.length < 12 ||
    !VALID_KEYS.includes(normalizedKey)
  ) {
    return {
      valid: false,
      message: 'Clé invalide, vérifie ton email Payhip',
    };
  }

  return {
    valid: true,
    message: 'Premium activé ! 🎉',
    normalizedKey,
  };
}
