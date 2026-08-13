import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { postsByIdempotencyKey, postsByExternalId, requestLog } from './state.js';
import { signWebhookPayload } from './signature.js';

const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_MAX_REQUESTS = 3; // deliberately low, so the demo/tests can trigger 429 quickly
const FORCED_429_RATE = 0.15; // additionally, randomly rate-limit ~15% of requests regardless of window, to simulate real-world burstiness
const RANDOM_FAILURE_RATE = 0.05; // ~5% of publish calls simulate a platform-side failure

const WEBHOOK_TARGET_URL = process.env.FAKE_PLATFORM_WEBHOOK_TARGET_URL ?? 'http://localhost:3000/webhook/social-delivery';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? '';
const WEBHOOK_DELAY_MS = Number(process.env.FAKE_PLATFORM_WEBHOOK_DELAY_MS ?? 500);

export const fakePlatformRouter = Router();

function isRateLimited(accountKey: string): boolean {
  const now = Date.now();
  const history = (requestLog.get(accountKey) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  history.push(now);
  requestLog.set(accountKey, history);
  if (history.length > RATE_LIMIT_MAX_REQUESTS) return true;
  return Math.random() < FORCED_429_RATE;
}

function requireBearerToken(req: Request, res: Response): boolean {
  const auth = req.header('authorization');
  if (!auth?.startsWith('Bearer ') || auth.length < 15) {
    res.status(401).json({ error: 'missing or malformed bearer token' });
    return false;
  }
  return true;
}

function handlePublish(platform: 'INSTAGRAM' | 'X') {
  return (req: Request, res: Response): void => {
    if (!requireBearerToken(req, res)) return;

    const { externalAccountId, idempotencyKey, caption, imageBase64 } = req.body as Record<string, unknown>;
    if (typeof externalAccountId !== 'string' || typeof idempotencyKey !== 'string' || typeof caption !== 'string' || typeof imageBase64 !== 'string') {
      res.status(400).json({ error: 'externalAccountId, idempotencyKey, caption, imageBase64 are required' });
      return;
    }

    // Idempotency is honored FIRST, before rate-limit or failure simulation
    // — a retried request that we've already completed must never be
    // punished with a fresh 429 or a fresh random failure.
    const existing = postsByIdempotencyKey.get(idempotencyKey);
    if (existing) {
      res.status(200).json({ externalPostId: existing.externalPostId, deduplicated: true, status: 'accepted' });
      return;
    }

    if (isRateLimited(externalAccountId)) {
      res.status(429).set('Retry-After', '2').json({ error: 'rate limit exceeded', retryAfterSeconds: 2 });
      return;
    }

    if (Math.random() < RANDOM_FAILURE_RATE) {
      res.status(500).json({ error: 'simulated transient platform failure' });
      return;
    }

    const externalPostId = `${platform.toLowerCase()}_${randomUUID()}`;
    const record = { externalPostId, idempotencyKey, platform, externalAccountId, caption, createdAt: Date.now() };
    postsByIdempotencyKey.set(idempotencyKey, record);
    postsByExternalId.set(externalPostId, record);

    res.status(200).json({ externalPostId, deduplicated: false, status: 'accepted' });

    // Fire the signed delivery webhook asynchronously, simulating real
    // platform delivery latency. Errors are logged, never thrown into the
    // response we already sent.
    setTimeout(() => {
      void dispatchDeliveryWebhook(record.externalPostId, platform).catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.error('Failed to dispatch delivery webhook', err);
      });
    }, WEBHOOK_DELAY_MS);
  };
}

async function dispatchDeliveryWebhook(externalPostId: string, platform: 'INSTAGRAM' | 'X'): Promise<void> {
  const payload = {
    eventId: randomUUID(),
    externalPostId,
    platform,
    outcome: 'delivered' as const,
  };
  const rawBody = JSON.stringify(payload);
  const signature = signWebhookPayload(rawBody, WEBHOOK_SECRET);

  await fetch(WEBHOOK_TARGET_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-webhook-signature': signature },
    body: rawBody,
  });
}

function handleStatus(req: Request, res: Response): void {
  if (!requireBearerToken(req, res)) return;
  const { externalPostId } = req.body as Record<string, unknown>;
  const post = typeof externalPostId === 'string' ? postsByExternalId.get(externalPostId) : undefined;
  if (!post) {
    res.status(404).json({ error: 'unknown externalPostId' });
    return;
  }
  res.status(200).json({ status: 'delivered' });
}

fakePlatformRouter.post('/instagram/publish', handlePublish('INSTAGRAM'));
fakePlatformRouter.post('/x/publish', handlePublish('X'));
fakePlatformRouter.post('/instagram/status', handleStatus);
fakePlatformRouter.post('/x/status', handleStatus);

// Minimal fake OAuth: exchanges a fixed dev "code" for a bearer token,
// used only by scripts/seed.ts to provision SocialAccount rows.
fakePlatformRouter.post('/oauth/token', (req: Request, res: Response) => {
  const { externalAccountId } = req.body as Record<string, unknown>;
  if (typeof externalAccountId !== 'string') {
    res.status(400).json({ error: 'externalAccountId is required' });
    return;
  }
  res.status(200).json({ accessToken: `fake_token_${randomUUID()}`, tokenType: 'bearer' });
});

fakePlatformRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});
