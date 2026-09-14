import { describe, it, expect } from 'vitest';
import {
  encrypt,
  decrypt,
  maskSensitive,
  sha256,
  deriveKey,
} from './encryption.util';

describe('Epic 16: Cryptographic Utilities & Data Protection (NFR-03)', () => {
  it('should encrypt and decrypt plaintext strings accurately', () => {
    const sensitiveData = 'applicant-mfa-backup-code-987654321';
    const encrypted = encrypt(sensitiveData);

    expect(encrypted).toBeDefined();
    expect(encrypted).toContain(':');
    expect(encrypted.split(':')).toHaveLength(3);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(sensitiveData);
  });

  it('should produce unique ciphertexts and IVs for the same plaintext across runs', () => {
    const text = 'same-token-value';
    const enc1 = encrypt(text);
    const enc2 = encrypt(text);

    expect(enc1).not.toBe(enc2);

    const iv1 = enc1.split(':')[0];
    const iv2 = enc2.split(':')[0];
    expect(iv1).not.toBe(iv2);

    expect(decrypt(enc1)).toBe(text);
    expect(decrypt(enc2)).toBe(text);
  });

  it('should support custom secret keys', () => {
    const customKey = 'my-custom-super-secure-key-1234567890';
    const payload = 'salary-bracket:150000-180000';

    const encrypted = encrypt(payload, customKey);
    const decrypted = decrypt(encrypted, customKey);

    expect(decrypted).toBe(payload);

    // Attempting decryption with different key should fail
    expect(() => decrypt(encrypted, 'wrong-secret-key-0987654321')).toThrow();
  });

  it('should detect tampering and reject modified ciphertexts (Authenticated GCM Tag)', () => {
    const original = 'sensitive-personal-identity-record';
    const encrypted = encrypt(original);
    const [iv, authTag, ciphertext] = encrypted.split(':');

    // Tamper with ciphertext by flipping last character
    const tamperedCiphertext =
      ciphertext.slice(0, -1) + (ciphertext.slice(-1) === 'a' ? 'b' : 'a');
    const tamperedPayload = `${iv}:${authTag}:${tamperedCiphertext}`;

    expect(() => decrypt(tamperedPayload)).toThrow();

    // Tamper with auth tag
    const tamperedTag =
      authTag.slice(0, -1) + (authTag.slice(-1) === '0' ? '1' : '0');
    const tamperedTagPayload = `${iv}:${tamperedTag}:${ciphertext}`;

    expect(() => decrypt(tamperedTagPayload)).toThrow();
  });

  it('should reject malformed encrypted payload strings', () => {
    expect(() => decrypt('not-a-valid-encrypted-string')).toThrow(
      /Invalid encrypted payload format/
    );
    expect(() => decrypt('')).toThrow(/non-empty string/);
  });

  it('should mask sensitive strings appropriately', () => {
    expect(maskSensitive('12345678901234', 4)).toBe('********1234');
    expect(maskSensitive('short', 4)).toBe('*hort');
    expect(maskSensitive('abc', 4)).toBe('***');
    expect(maskSensitive('')).toBe('');
  });

  it('should generate deterministic SHA-256 digests', () => {
    const hash1 = sha256('test-string-input');
    const hash2 = sha256('test-string-input');
    const hash3 = sha256('different-string-input');

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    expect(hash1).not.toBe(hash3);
  });

  it('should derive 32-byte keys consistently', () => {
    const key1 = deriveKey('my-secret');
    const key2 = deriveKey('my-secret');

    expect(key1).toHaveLength(32);
    expect(key1.equals(key2)).toBe(true);
  });
});
