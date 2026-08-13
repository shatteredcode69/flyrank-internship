import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';
import { logger } from '../../shared/logging/logger.js';
import { resolveRetryDelayMs } from '../../shared/utilities/backoff.js';
import type { Platform } from '../../domain/platform/platform.js';

export interface FakePlatformPublishBody {
  platform: Platform;
  externalAccountId: string;
  idempotencyKey: string;
  imagePath: string;
  caption: string;
}

export interface FakePlatformPublishResponse {
  externalPostId: string;
  deduplicated: boolean;
  status: 'accepted';
}

const MAX_ATTEMPTS = 5;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Thin HTTP client for the fake social platform server (fake-platform/),
 * with 429/Retry-After handling and jittered backoff built in centrally so
 * every adapter gets it for free (§12 of the build spec). Adapters remain
 * responsible for translating the *result* into domain terms — this client
 * only owns "how do we talk to the wire without hammering it".
 */
export async function callFakePlatform<TBody extends Record<string, unknown>, TResponse>(
  pathSuffix: string,
  body: TBody,
  headers: Record<string, string> = {},
): Promise<TResponse> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop -- retries are sequential by definition
    const response = await fetch(`${env.FAKE_PLATFORM_BASE_URL}${pathSuffix}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }).catch((err: unknown) => {
      lastError = err;
      return null;
    });

    if (!response) {
      // Network-level failure (e.g. simulated timeout) — no Retry-After
      // available, fall back to jittered exponential backoff.
      const delay = resolveRetryDelayMs({ attempt });
      logger.warn({ attempt, delay, pathSuffix }, 'Fake platform request failed at network level, backing off');
      // eslint-disable-next-line no-await-in-loop
      await sleep(delay);
      continue;
    }

    if (response.status === 429) {
      const retryAfterHeader = response.headers.get('retry-after') ?? undefined;
      const delay = resolveRetryDelayMs({ retryAfterHeader, attempt });
      logger.warn(
        { attempt, delay, retryAfterHeader, pathSuffix },
        'Fake platform rate-limited us (429); honoring Retry-After before retrying',
      );
      // eslint-disable-next-line no-await-in-loop
      await sleep(delay);
      continue;
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '<unreadable body>');
      throw AppError.externalService(`Fake platform returned ${response.status}`, {
        status: response.status,
        body: text,
      });
    }

    return (await response.json()) as TResponse;
  }

  throw AppError.externalService('Fake platform request exhausted retries', {
    pathSuffix,
    cause: lastError instanceof Error ? lastError.message : String(lastError),
  });
}
