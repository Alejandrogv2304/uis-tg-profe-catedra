import { createHash, randomBytes } from 'crypto';

export function generateResetToken(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
