/**
 * Retry/backoff calculations, unit-tested in tests/unit/backoff.test.ts.
 *
 * Two distinct sources of delay are handled deliberately differently:
 *  - A server-provided `Retry-After` (seconds or HTTP-date) is authoritative
 *    and MUST be honored as a floor — we never retry sooner than it says.
 *  - In the absence of `Retry-After` (e.g. a transient network error), we
 *    fall back to exponential backoff with full jitter.
 */

export function parseRetryAfter(headerValue: string | undefined, now: Date = new Date()): number | null {
  if (!headerValue) return null;
  const asSeconds = Number(headerValue);
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return Math.round(asSeconds * 1000);
  }
  const asDate = new Date(headerValue);
  if (!Number.isNaN(asDate.getTime())) {
    return Math.max(0, asDate.getTime() - now.getTime());
  }
  return null;
}

export interface BackoffOptions {
  baseDelayMs?: number;
  maxDelayMs?: number;
  attempt: number; // 1-indexed
}

/** Exponential backoff with full jitter: random in [0, min(max, base*2^attempt)]. */
export function exponentialBackoffWithJitter({
  baseDelayMs = 500,
  maxDelayMs = 60_000,
  attempt,
}: BackoffOptions): number {
  const cap = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
  return Math.floor(Math.random() * cap);
}

/**
 * The delay a caller should actually wait before retrying: the
 * server-provided Retry-After if present (authoritative floor), otherwise
 * jittered exponential backoff.
 */
export function resolveRetryDelayMs(params: {
  retryAfterHeader?: string;
  attempt: number;
  now?: Date;
}): number {
  const fromHeader = parseRetryAfter(params.retryAfterHeader, params.now);
  if (fromHeader !== null) return fromHeader;
  return exponentialBackoffWithJitter({ attempt: params.attempt });
}
