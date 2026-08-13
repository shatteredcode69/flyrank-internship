# Reliability

## Idempotency (§11 — the most heavily-weighted requirement)

Anchor: `deterministicIdempotencyKey(campaignId, platform)` — `sha256(campaignId:platform)`,
always the same value for the same logical publish request, computed once at `SocialPost`
creation time and stored in the unique `idempotencyKey` column.

`publish-social-post.usecase.ts` consults the durable `IdempotencyRecord` **before** ever
calling the platform:

| Record state | Action |
|---|---|
| none | create `IN_FLIGHT` record, then call the platform |
| `COMPLETED` | short-circuit — return immediately, **zero** network calls |
| `IN_FLIGHT` | call the platform again **with the same idempotency key**; the fake platform itself recognizes the key and returns `{ deduplicated: true }` with the original `externalPostId` instead of creating a new post |

This handles the brief's hard case directly: application sends publish → fake platform accepts
→ network timeout before we see the response → worker retries. The retry reuses the same key,
so the fake platform (which checks `postsByIdempotencyKey` **before** rate-limit/failure
simulation — see `fake-platform/src/routes.ts`) returns the original post rather than creating
a second one.

Database-level backstop: `SocialPost.idempotencyKey` and `(campaignId, platform)` are both
`UNIQUE` — even a bug in the application-level check could not produce two rows for one
logical publish.

## Rate limits

`infrastructure/platforms/fake-platform-http-client.ts` centralizes 429 handling for every
adapter: on `429`, it reads `Retry-After` (seconds or HTTP-date, via
`shared/utilities/backoff.ts::parseRetryAfter`) and waits at least that long before retrying;
in the absence of a header it falls back to jittered exponential backoff
(`exponentialBackoffWithJitter`). Up to 5 attempts per call.

## Durable scheduling & crash recovery

Two cooperating mechanisms (`worker/worker.ts`):

1. **BullMQ Worker** — fast path, consumes delayed jobs from Redis as they become due, with
   `attempts: 5` + exponential backoff configured on the queue itself.
2. **Recovery sweep** — every 15s, queries Postgres directly for `SocialPost` rows with
   `status = QUEUED` and `scheduledAt <= now`. This is the actual durable source of truth: even
   if the worker process was down when a job would have fired, or Redis lost the job, the sweep
   finds it independently of BullMQ's own bookkeeping.

Because the underlying `publishSocialPost` call is fully idempotent, it is always safe for
both mechanisms to race on the same post — whichever gets there first wins, the other's call
is a no-op via the `IdempotencyRecord` check above. This is exactly what makes "worker crashes
mid-batch, restarts, resumes without duplicates" true by construction rather than by careful
timing.

## Webhook trust boundary

See `docs/security.md` for the signature mechanics. The reliability property specifically: a
forged or malformed webhook has **zero** effect on any `SocialPost` row — the signature check
runs before any database write, and `handle-social-delivery-webhook.usecase.ts` returns a
`rejected` result on failure without touching `socialPostRepo` at all.
