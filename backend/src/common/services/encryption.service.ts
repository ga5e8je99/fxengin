import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';

  // 32-byte secret key derived from environment or static high-entropy fallback
  private readonly secretKey: Buffer;

  constructor() {
    const rawSecret =
      process.env.ENCRYPTION_SECRET_KEY ||
      'fxengin_master_aes256_vault_key_2026_super_secure_institutional_grade!';
    this.secretKey = crypto.createHash('sha256').update(rawSecret).digest();
  }

  /**
   * Encrypts plaintext string using AES-256-GCM authenticated cipher.
   * Returns format: iv:authTag:ciphertext (all in hex)
   */
  encrypt(plaintext: string): string {
    if (!plaintext) return plaintext;
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');
      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (err) {
      this.logger.error(`Encryption failed: ${err.message}`);
      return plaintext;
    }
  }

  /**
   * Decrypts AES-256-GCM ciphertext. Returns original plaintext.
   */
  decrypt(ciphertext: string): string {
    if (!ciphertext || !ciphertext.includes(':')) return ciphertext;
    try {
      const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
      if (!ivHex || !authTagHex || !encryptedHex) return ciphertext;

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      this.logger.warn(`Decryption failed or data is unencrypted plaintext: ${err.message}`);
      return ciphertext;
    }
  }

  /**
   * Masks a phone number so no raw private number is leaked to the client browser.
   * Example: '+966501234567' -> '+966 50 ••• ••67'
   */
  maskPhone(phone: string | null | undefined): string | null {
    if (!phone) return null;
    const clean = phone.trim();
    if (clean.length < 7) return '••••••';
    const prefix = clean.slice(0, 7);
    const suffix = clean.slice(-2);
    return `${prefix} ••• ••${suffix}`;
  }

  /**
   * Masks an email address to prevent client-side address harvesting.
   * Example: 'ahmed.trader@fxengen.com' -> 'ah***@fxengen.com'
   */
  maskEmail(email: string): string {
    if (!email) return email;
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) {
      return `${name[0]}***@${domain}`;
    }
    return `${name.slice(0, 2)}***@${domain}`;
  }
}
