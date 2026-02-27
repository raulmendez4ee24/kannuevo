import crypto from 'node:crypto';

const PAYMENT_KEY_REGEX = /^[a-f0-9]{64}$/i;
const DEFAULT_DEV_KEY_HEX = crypto.createHash('sha256').update('kanlogic-dev-payment-key').digest('hex');
const rawEncryptionKey = process.env.PAYMENT_ENCRYPTION_KEY;
const isValidEncryptionKey = rawEncryptionKey ? PAYMENT_KEY_REGEX.test(rawEncryptionKey) : false;

if (!isValidEncryptionKey && process.env.NODE_ENV === 'production') {
  throw new Error('PAYMENT_ENCRYPTION_KEY debe ser hex de 64 caracteres en producción.');
}

const ENCRYPTION_KEY = isValidEncryptionKey ? rawEncryptionKey! : DEFAULT_DEV_KEY_HEX;
const ALGORITHM = 'aes-256-gcm';

export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function randomOtpCode(): string {
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, '0');
}

/**
 * Encripta datos sensibles usando AES-256-GCM
 */
export function encryptPaymentData(data: string): string {
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'); // 32 bytes para AES-256
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Formato: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Desencripta datos usando AES-256-GCM
 */
export function decryptPaymentData(encryptedData: string): string {
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
  const parts = encryptedData.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Encripta un objeto completo
 */
export function encryptPaymentObject(obj: Record<string, any>): string {
  return encryptPaymentData(JSON.stringify(obj));
}

/**
 * Desencripta un objeto completo
 */
export function decryptPaymentObject(encryptedData: string): Record<string, any> {
  return JSON.parse(decryptPaymentData(encryptedData));
}

export function maskCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  const last4 = digits.slice(-4);
  return last4 ? `**** **** **** ${last4}` : '****';
}

export function isValidCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = Number(digits[i]);
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function isExpiryValid(expiry: string): boolean {
  const match = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  const month = Number(match[1]);
  const year = Number(match[2]);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const nowMonth = now.getMonth() + 1;
  const nowYear = now.getFullYear() % 100;
  if (year < nowYear) return false;
  if (year === nowYear && month < nowMonth) return false;
  return true;
}
