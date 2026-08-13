import { describe, it, expect } from 'vitest';
import { randomBytes } from 'node:crypto';
import { TokenCipher } from '../../src/infrastructure/crypto/token-cipher.js';

describe('TokenCipher (AES-256-GCM)', () => {
  const key = randomBytes(32).toString('base64');
  const cipher = new TokenCipher(key);

  it('round-trips plaintext through encrypt/decrypt', () => {
    const plaintext = 'fake_oauth_access_token_abc123';
    const encrypted = cipher.encrypt(plaintext);
    expect(cipher.decrypt(encrypted)).toBe(plaintext);
  });

  it('uses a distinct random IV for every encryption of the same plaintext', () => {
    const a = cipher.encrypt('same-value');
    const b = cipher.encrypt('same-value');
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it('fails closed on tampered ciphertext (auth tag mismatch)', () => {
    const encrypted = cipher.encrypt('secret-token');
    const tampered = { ...encrypted, ciphertext: Buffer.from('garbage-data-here').toString('base64') };
    expect(() => cipher.decrypt(tampered)).toThrow();
  });

  it('rejects a key that is not exactly 32 bytes', () => {
    expect(() => new TokenCipher(Buffer.from('too-short').toString('base64'))).toThrow();
  });
});
