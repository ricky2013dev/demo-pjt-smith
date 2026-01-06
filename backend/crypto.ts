import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

// Get encryption key from environment or generate a secure one
// In production, this should be stored securely (e.g., AWS KMS, HashiCorp Vault)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secure-encryption-key-change-in-production-must-be-32-chars!!';

/**
 * Derives a key from the master key using PBKDF2
 */
function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    ENCRYPTION_KEY,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha512'
  );
}

/**
 * Encrypts sensitive data using AES-256-GCM
 * @param plaintext - The data to encrypt
 * @returns Encrypted data in format: salt:iv:tag:ciphertext (all base64 encoded)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return '';

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive key from master key and salt
  const key = deriveKey(salt);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt data
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');

  // Get authentication tag
  const tag = cipher.getAuthTag();

  // Combine all parts: salt:iv:tag:ciphertext
  return `${salt.toString('base64')}:${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext}`;
}

/**
 * Decrypts data encrypted with the encrypt function
 * @param encryptedData - The encrypted data in format: salt:iv:tag:ciphertext
 * @returns Decrypted plaintext
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return '';

  try {
    // Split the encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const [saltB64, ivB64, tagB64, ciphertext] = parts;

    // Convert from base64
    const salt = Buffer.from(saltB64, 'base64');
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');

    // Derive the same key using the salt
    const key = deriveKey(salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    // Decrypt data
    let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  } catch (error) {
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Masks sensitive data for display (e.g., "1990-05-15" -> "****-**-**")
 * @param data - The data to mask
 * @returns Masked string
 */
export function maskSensitiveData(data: string): string {
  if (!data) return '';

  // For dates in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return '****-**-**';
  }

  // For other data, show only last 4 characters
  if (data.length <= 4) {
    return '*'.repeat(data.length);
  }

  return '*'.repeat(data.length - 4) + data.slice(-4);
}

/**
 * Encrypts an object's sensitive fields
 * @param obj - Object with sensitive fields
 * @param sensitiveFields - Array of field names to encrypt
 * @returns Object with encrypted fields
 */
export function encryptObject<T extends Record<string, any>>(
  obj: T,
  sensitiveFields: (keyof T)[]
): T {
  const encrypted = { ...obj };

  for (const field of sensitiveFields) {
    if (encrypted[field]) {
      encrypted[field] = encrypt(String(encrypted[field])) as any;
    }
  }

  return encrypted;
}

/**
 * Decrypts an object's sensitive fields
 * @param obj - Object with encrypted fields
 * @param sensitiveFields - Array of field names to decrypt
 * @returns Object with decrypted fields
 */
export function decryptObject<T extends Record<string, any>>(
  obj: T,
  sensitiveFields: (keyof T)[]
): T {
  const decrypted = { ...obj };

  for (const field of sensitiveFields) {
    if (decrypted[field]) {
      try {
        decrypted[field] = decrypt(String(decrypted[field])) as any;
      } catch (error) {
        // Keep encrypted value if decryption fails
      }
    }
  }

  return decrypted;
}
