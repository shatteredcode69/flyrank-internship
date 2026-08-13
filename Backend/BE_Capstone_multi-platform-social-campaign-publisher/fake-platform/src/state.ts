/**
 * In-memory state for the fake platform. Deliberately non-persistent — a
 * restart of the fake platform simulates "the external vendor had an
 * outage", which is a fine thing for a demo to occasionally exercise, but
 * is NOT the reliability mechanism under test (that's our own worker's
 * crash recovery, tested by restarting *our* worker, not this service).
 */
export interface StoredPost {
  externalPostId: string;
  idempotencyKey: string;
  platform: 'INSTAGRAM' | 'X';
  externalAccountId: string;
  caption: string;
  createdAt: number;
}

export const postsByIdempotencyKey = new Map<string, StoredPost>();
export const postsByExternalId = new Map<string, StoredPost>();

/** externalAccountId -> simple bearer token issued at "OAuth" time. */
export const issuedTokens = new Map<string, string>();

/** Sliding-window request counters per externalAccountId, for 429 simulation. */
export const requestLog = new Map<string, number[]>();
