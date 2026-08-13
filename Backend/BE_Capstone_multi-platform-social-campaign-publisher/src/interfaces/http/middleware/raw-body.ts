import type { Request, Response, NextFunction } from 'express';
import express from 'express';

/**
 * Captures the exact raw bytes of the webhook request body BEFORE any JSON
 * parsing/re-serialization can alter them. HMAC signature verification
 * must run against these exact bytes — see infrastructure/crypto/webhook-signature.ts.
 */
export const captureRawBody = express.json({
  verify: (req: Request, _res: Response, buf: Buffer) => {
    (req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
  },
});

export function getRawBody(req: Request): Buffer {
  const buf = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!buf) throw new Error('Raw body was not captured — check middleware ordering');
  return buf;
}
