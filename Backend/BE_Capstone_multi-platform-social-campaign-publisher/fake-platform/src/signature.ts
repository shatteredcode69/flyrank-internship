import { createHmac } from 'node:crypto';

/**
 * Signs outgoing delivery webhooks with the same shared secret the main
 * app verifies against (WEBHOOK_SECRET). This mirrors the real-world
 * arrangement where platform and consumer share a signing secret
 * out-of-band (e.g. shown once in a developer-app dashboard).
 */
export function signWebhookPayload(rawBody: string, secret: string): string {
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}
