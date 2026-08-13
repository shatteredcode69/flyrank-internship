import { describe, it, expect } from 'vitest';
import { deterministicIdempotencyKey } from '../../src/shared/utilities/ids.js';

describe('deterministicIdempotencyKey', () => {
  it('is stable for the same (campaignId, platform) pair', () => {
    const a = deterministicIdempotencyKey('camp_1', 'INSTAGRAM');
    const b = deterministicIdempotencyKey('camp_1', 'INSTAGRAM');
    expect(a).toBe(b);
  });

  it('differs across platforms for the same campaign', () => {
    const ig = deterministicIdempotencyKey('camp_1', 'INSTAGRAM');
    const x = deterministicIdempotencyKey('camp_1', 'X');
    expect(ig).not.toBe(x);
  });

  it('differs across campaigns for the same platform', () => {
    const a = deterministicIdempotencyKey('camp_1', 'X');
    const b = deterministicIdempotencyKey('camp_2', 'X');
    expect(a).not.toBe(b);
  });
});
