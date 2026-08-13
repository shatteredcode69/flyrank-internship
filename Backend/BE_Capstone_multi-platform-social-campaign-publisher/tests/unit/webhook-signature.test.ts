import { describe, it, expect } from 'vitest';
import { computeSignature, verifySignature } from '../../src/infrastructure/crypto/webhook-signature.js';

describe('webhook signature verification', () => {
  const secret = 'a-shared-secret-value-1234567890';
  const body = JSON.stringify({ eventId: 'evt_1', externalPostId: 'x_1', platform: 'X', outcome: 'delivered' });

  it('accepts a correctly signed payload', () => {
    const sig = computeSignature(body, secret);
    expect(verifySignature(body, sig, secret)).toBe(true);
  });

  it('rejects a forged signature', () => {
    const forged = computeSignature(body, 'wrong-secret');
    expect(verifySignature(body, forged, secret)).toBe(false);
  });

  it('rejects a tampered body against the original signature', () => {
    const sig = computeSignature(body, secret);
    const tamperedBody = body.replace('delivered', 'failed');
    expect(verifySignature(tamperedBody, sig, secret)).toBe(false);
  });

  it('rejects a signature of a different length without throwing', () => {
    expect(() => verifySignature(body, 'deadbeef', secret)).not.toThrow();
    expect(verifySignature(body, 'deadbeef', secret)).toBe(false);
  });
});
