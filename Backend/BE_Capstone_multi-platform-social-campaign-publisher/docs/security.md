# Security

## Token encryption at rest

`infrastructure/crypto/token-cipher.ts` — AES-256-GCM. A fresh random 96-bit IV/nonce is
generated on every single `encrypt()` call (never reused across encryptions, even for the
same plaintext), and the GCM authentication tag is stored alongside the ciphertext so any
tampering with a stored row is detected on decrypt rather than silently producing garbage
plaintext. Key comes from `ENCRYPTION_KEY` (32 raw bytes, base64), validated at boot by
`config/env.ts` — the app refuses to start with a malformed key.

## Webhook signatures

`infrastructure/crypto/webhook-signature.ts` — HMAC-SHA256 over the **raw, unparsed** request
body (captured by `interfaces/http/middleware/raw-body.ts` before any JSON re-serialization
could change byte-for-byte content), compared with `crypto.timingSafeEqual` to avoid leaking
timing information that could help forge a valid signature byte-by-byte.

## What is never logged

`shared/logging/logger.ts` configures `pino` redaction for `token`, `accessToken`,
`encryptedToken`, `encryptionKey`, `webhookSecret`, and `req.headers.authorization` as a
backstop — but the primary defense is that no call site ever constructs a log object
containing a decrypted token in the first place. `publish-social-post.usecase.ts` decrypts a
token into a local variable only for the duration of the `publisher.publish()` call and never
passes it to `logger.*`.

## Secrets handling

- `.env` is git-ignored; `.env.example` ships only placeholder values.
- `ENCRYPTION_KEY` / `WEBHOOK_SECRET` are read once at boot via `config/env.ts` (Zod-validated)
  and never appear in source.
- The fake platform's OAuth stub (`fake-platform/src/routes.ts` → `/oauth/token`) issues
  synthetic tokens only — no real credentials exist anywhere in this repository.

## Input validation

Every HTTP write path validates with Zod (`interfaces/http/schemas/`) before touching the
database; malformed input returns `400` with `{ error: { type: 'ValidationError', ... } }`,
never a raw `500`. Webhook payloads are validated by schema *after* signature verification, so
a forged request never reaches the parser with any expectation of being trusted.

## SQL injection

All database access goes through Prisma's generated client — no raw string-interpolated SQL
anywhere in the application (the one `$queryRaw` in `health.controller.ts` is a fixed
`SELECT 1` literal with no interpolated input).

## Limitations (honest, per §33)

- The fake platform's bearer-token check (`requireBearerToken` in `fake-platform/src/routes.ts`)
  is a shape check, not real OAuth — intentional, since this whole path is simulated per the
  brief's sandbox-first rule.
- There is no per-user authentication/authorization layer on the campaign API itself (no
  `AuthenticationError`/`AuthorizationError` is actually raised anywhere yet) — the brief's
  Definition of Done does not require multi-tenant auth for this capstone, and adding it was
  judged out of scope per §7 "Realistic scope — where to stop." Documented here rather than
  silently omitted.
- Rate limiting on the fake platform is intentionally aggressive/random for demo purposes; it
  is not a specification of realistic Instagram/X limits.
