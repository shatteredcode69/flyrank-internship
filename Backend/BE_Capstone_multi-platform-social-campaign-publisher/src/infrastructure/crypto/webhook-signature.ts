import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * HMAC-SHA256 webhook signature verification (mirrors the Stripe-style
 * pattern referenced in the brief: lib/serverUtils.ts /
 * app/api/webhooks/stripe/route.ts).
 *
 * CRITICAL: signature must be computed over the *raw* request body bytes,
 * not a re-serialized JSON object — re-serialization can reorder keys or
 * change whitespace and silently break every legitimate signature. The
 * raw-body middleware (src/interfaces/http/middleware/raw-body.ts) is what
 * guarantees callers here receive the untouched bytes.
 */
export function computeSignature(rawBody: Buffer | string, secret: string): string {
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}

/**
 * Constant-time comparison — a naive `===` on signature strings leaks
 * timing information that can be used to forge a valid signature
 * byte-by-byte. `timingSafeEqual` requires equal-length buffers, so a
 * length mismatch is treated as "not equal" without ever touching
 * timingSafeEqual (which would throw on mismatched lengths).
 */
export function verifySignature(
  rawBody: Buffer | string,
  providedSignatureHex: string,
  secret: string,
): boolean {
  const expected = computeSignature(rawBody, secret);
  const expectedBuf = Buffer.from(expected, 'hex');
  const providedBuf = Buffer.from(providedSignatureHex, 'hex');
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}
