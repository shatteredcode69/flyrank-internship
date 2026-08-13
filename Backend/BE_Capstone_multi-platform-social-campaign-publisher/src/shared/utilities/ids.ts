import { randomUUID, createHash } from 'node:crypto';

export function newId(): string {
  return randomUUID();
}

/**
 * Deterministic idempotency key for a (campaign, platform) publish request.
 * Same campaign + same platform ALWAYS yields the same key, regardless of
 * how many times publish is invoked or retried — this is the anchor that
 * makes "publish five times" converge on exactly one platform post.
 */
export function deterministicIdempotencyKey(campaignId: string, platform: string): string {
  return createHash('sha256').update(`${campaignId}:${platform}`).digest('hex');
}

export function requestCorrelationId(): string {
  return `req_${randomUUID()}`;
}
