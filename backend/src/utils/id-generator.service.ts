import { Injectable } from '@nestjs/common';

@Injectable()
export class IdGeneratorService {
  private readonly defaultCharset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed confusing chars (0, O, 1, I)
  
  /**
   * Generates a cryptographically secure random order ID using crypto.randomBytes
   * @param length Length of the generated ID (default: 8)
   * @param charset Character set to use (default: alphanumeric without confusing chars)
   * @returns Cryptographically secure random string
   */
  generateSecureOrderId(length: number = 8, charset?: string): string {
    const chars = charset || this.defaultCharset;
    const crypto = require('crypto');
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const randomByte = crypto.randomBytes(1)[0];
      result += chars.charAt(randomByte % chars.length);
    }
    
    return result;
  }
} 