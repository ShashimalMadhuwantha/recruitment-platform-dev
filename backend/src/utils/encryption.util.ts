import crypto from 'crypto';
import { config } from '../config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for AES-GCM
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag
const DEFAULT_SALT = 'recruitment-platform-ats-salt';

/**
 * Derive a 32-byte AES key from a secret string using scrypt
 */
export function deriveKey(secret?: string): Buffer {
  const secretString = secret || config.JWT_SECRET || 'default-secret-fallback-key-32b';
  return crypto.scryptSync(secretString, DEFAULT_SALT, 32);
}

/**
 * Encrypt a plaintext string using AES-256-GCM authenticated encryption (NFR-03)
 * Returns format: `${ivHex}:${authTagHex}:${ciphertextHex}`
 */
export function encrypt(plaintext: string, secretKey?: string): string {
  if (typeof plaintext !== 'string') {
    throw new Error('Plaintext must be a string');
  }

  const key = deriveKey(secretKey);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}

/**
 * Decrypt an AES-256-GCM encrypted payload (NFR-03)
 * Expects format: `${ivHex}:${authTagHex}:${ciphertextHex}`
 */
export function decrypt(encryptedPayload: string, secretKey?: string): string {
  if (!encryptedPayload || typeof encryptedPayload !== 'string') {
    throw new Error('Encrypted payload must be a non-empty string');
  }

  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format. Expected iv:authTag:ciphertext');
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected ${IV_LENGTH} bytes`);
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error(`Invalid authentication tag length: expected ${AUTH_TAG_LENGTH} bytes`);
  }

  const key = deriveKey(secretKey);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Mask sensitive strings for audit logs or display (e.g. email, tokens)
 */
export function maskSensitive(value: string, visibleChars = 4): string {
  if (!value) return '';
  if (value.length <= visibleChars) return '***';
  const visible = value.slice(-visibleChars);
  return `${'*'.repeat(Math.min(8, value.length - visibleChars))}${visible}`;
}

/**
 * Compute SHA-256 digest for deterministic hashing
 */
export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}
