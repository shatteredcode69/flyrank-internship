import { describe, it, expect } from 'vitest';
import { parseRetryAfter, exponentialBackoffWithJitter, resolveRetryDelayMs } from '../../src/shared/utilities/backoff.js';

describe('parseRetryAfter', () => {
  it('parses a numeric seconds value', () => {
    expect(parseRetryAfter('30')).toBe(30_000);
  });

  it('parses an HTTP-date value relative to now', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const future = new Date('2026-01-01T00:00:10Z').toUTCString();
    expect(parseRetryAfter(future, now)).toBe(10_000);
  });

  it('returns null for missing/invalid header', () => {
    expect(parseRetryAfter(undefined)).toBeNull();
    expect(parseRetryAfter('not-a-value')).toBeNull();
  });
});

describe('exponentialBackoffWithJitter', () => {
  it('never exceeds the configured max delay', () => {
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      const delay = exponentialBackoffWithJitter({ attempt, baseDelayMs: 500, maxDelayMs: 5000 });
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(5000);
    }
  });

  it('grows the cap with attempt number (until maxed)', () => {
    // Sample many times since jitter is random; the ceiling should grow.
    const samplesAttempt1 = Array.from({ length: 50 }, () => exponentialBackoffWithJitter({ attempt: 1 }));
    const samplesAttempt5 = Array.from({ length: 50 }, () => exponentialBackoffWithJitter({ attempt: 5 }));
    expect(Math.max(...samplesAttempt5)).toBeGreaterThan(Math.max(...samplesAttempt1));
  });
});

describe('resolveRetryDelayMs', () => {
  it('prefers the server Retry-After over computed backoff', () => {
    const delay = resolveRetryDelayMs({ retryAfterHeader: '5', attempt: 3 });
    expect(delay).toBe(5000);
  });

  it('falls back to jittered backoff when no header is present', () => {
    const delay = resolveRetryDelayMs({ attempt: 2 });
    expect(delay).toBeGreaterThanOrEqual(0);
  });
});
