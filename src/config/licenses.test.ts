import test from 'node:test';
import assert from 'node:assert/strict';
import { VALID_KEYS, validateLicenseKey } from './licenses';

test('VALID_KEYS contains demo and test keys', () => {
  assert.ok(VALID_KEYS.includes('MAHFOUD-DEMO-2026'));
  assert.ok(VALID_KEYS.includes('MAHFOUD-TEST-1234'));
});

test('validateLicenseKey accepts valid keys case-insensitively with whitespace', () => {
  const res1 = validateLicenseKey('MAHFOUD-DEMO-2026');
  assert.equal(res1.valid, true);
  assert.equal(res1.message, 'Premium activé ! 🎉');

  const res2 = validateLicenseKey('  mahfoud-test-1234  ');
  assert.equal(res2.valid, true);
  assert.equal(res2.normalizedKey, 'MAHFOUD-TEST-1234');
});

test('validateLicenseKey rejects wrong prefix, short length, or unknown key', () => {
  const wrongPrefix = validateLicenseKey('OTHER-DEMO-2026');
  assert.equal(wrongPrefix.valid, false);
  assert.equal(wrongPrefix.message, 'Clé invalide, vérifie ton email Payhip');

  const tooShort = validateLicenseKey('MAHFOUD-123');
  assert.equal(tooShort.valid, false);

  const unknown = validateLicenseKey('MAHFOUD-FAKE-9999');
  assert.equal(unknown.valid, false);
});
