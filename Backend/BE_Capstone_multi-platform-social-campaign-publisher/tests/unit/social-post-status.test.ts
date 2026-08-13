import { describe, it, expect } from 'vitest';
import { isValidTransition, assertValidTransition } from '../../src/domain/social-post/social-post-status.js';

describe('SocialPost state machine', () => {
  it('allows QUEUED -> PUBLISHING -> PUBLISHED', () => {
    expect(isValidTransition('QUEUED', 'PUBLISHING')).toBe(true);
    expect(isValidTransition('PUBLISHING', 'PUBLISHED')).toBe(true);
  });

  it('allows PUBLISHING -> FAILED', () => {
    expect(isValidTransition('PUBLISHING', 'FAILED')).toBe(true);
  });

  it('rejects QUEUED -> PUBLISHED directly (must pass through PUBLISHING)', () => {
    expect(isValidTransition('QUEUED', 'PUBLISHED')).toBe(false);
  });

  it('rejects any transition out of PUBLISHED (terminal state)', () => {
    expect(isValidTransition('PUBLISHED', 'PUBLISHING')).toBe(false);
    expect(isValidTransition('PUBLISHED', 'FAILED')).toBe(false);
  });

  it('rejects a no-op transition to the same state', () => {
    expect(isValidTransition('PUBLISHING', 'PUBLISHING')).toBe(false);
  });

  it('throws via assertValidTransition on an illegal transition', () => {
    expect(() => assertValidTransition('QUEUED', 'PUBLISHED')).toThrow();
  });
});
