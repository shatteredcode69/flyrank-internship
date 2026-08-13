# Evidence

One row per Definition-of-Done checkbox (brief §6). Per the master build prompt's explicit
anti-cheat rule, nothing below is marked "done" without something a reviewer can independently
check — and every claim that could not be executed in the authoring sandbox (no Docker,
Postgres, Redis, or network egress — see `BUILDLOG.md`) is marked `BLOCKED` with the exact
command to run to get real proof, rather than asserted as passing.

| # | Requirement | Implementation | Test | Status |
|---|---|---|---|---|
| 1 | Platform image variants generated correctly (dimensions, aspect ratio, safe zone) | `src/infrastructure/image/image-variant-generator.ts` | `tests/unit/image-variant.test.ts` | **BLOCKED: cannot execute in this sandbox (no `npm install` — network egress blocked).** Reviewer: `npm install && npm run test:unit`. Code re-verifies output dimensions with a post-write `sharp(outputPath).metadata()` check, so a pass is a real assertion, not a stub. |
| 2 | Captions platform-aware, composed from shared + platform fragments, no duplicated prompts | `src/config/social-prompts.config.ts` + `src/application/campaigns/compose-caption.ts` | `tests/unit/caption-composition.test.ts` | **BLOCKED** — same as above. `npm run test:unit`. |
| 3 | One `SocialPublisher` interface, ≥2 implementations, application depends on interface only | `src/infrastructure/platforms/social-publisher.port.ts`, `fake-instagram/`, `fake-x/`, `publisher-registry.ts` | Static review: `grep -rn "instanceof Fake\|=== 'INSTAGRAM'" src/application/` returns nothing | **Verifiable now by inspection** — grep the repo yourself; the pattern above returns zero matches outside `infrastructure/platforms/` and `domain/platform/platform.ts`. |
| 4 | OAuth tokens encrypted at rest, random IV, never logged | `src/infrastructure/crypto/token-cipher.ts`, `social-account.repository.ts` | `tests/unit/token-cipher.test.ts`, `tests/e2e/probe6-no-plaintext-tokens.test.ts` | **BLOCKED (unit + e2e need `npm install` / live DB).** `npm run test:unit` for the pure crypto round-trip; `docker compose exec api npm run test:e2e` for the DB-backed probe. |
| 5 | Idempotent publishing: same publish twice/retried after timeout → exactly one post | `src/application/publishing/publish-social-post.usecase.ts`, `idempotency.repository.ts` | `tests/integration/idempotent-publish.test.ts` | **BLOCKED (needs live Postgres+Redis+fake-platform).** `docker compose exec api npm run test:integration`. |
| 6 | 429 handled, `Retry-After` respected, no hammering | `src/infrastructure/platforms/fake-platform-http-client.ts` | `tests/e2e/probe2-rate-limit.test.ts`, `tests/unit/backoff.test.ts` | **BLOCKED.** Unit backoff math: `npm run test:unit`. Full e2e against the fake platform's real 429s: `docker compose exec api npm run test:e2e`. |
| 7 | Scheduling durable, crash mid-batch resumes without duplicates | `worker/worker.ts` (BullMQ + 15s recovery sweep), `src/infrastructure/queue/publish-queue.ts` | `tests/e2e/probe3-crash-recovery.test.ts` | **BLOCKED for the automated proxy; a literal process-kill is a manual step regardless of sandbox** — see `docs/testing.md` for exactly what the automated test does and doesn't prove. Manual: README → 6-Minute Demo, step 8. |
| 8 | Delivery webhooks signature-verified, forged/modified rejected with 400 | `src/infrastructure/crypto/webhook-signature.ts`, `handle-social-delivery-webhook.usecase.ts` | `tests/unit/webhook-signature.test.ts`, `tests/integration/webhook-verification.test.ts` | **BLOCKED.** Unit: `npm run test:unit`. Integration (real DB): `docker compose exec api npm run test:integration`. |
| 9 | Campaign status transitions only after verified webhook | `src/domain/social-post/social-post-status.ts` (whitelist), enforced in the publish + webhook use cases | `tests/unit/social-post-status.test.ts`, `tests/integration/webhook-verification.test.ts` | **BLOCKED**, same commands as #8. State-machine unit test has zero external dependencies and is the single most likely test to pass unmodified once `npm install` succeeds. |
| 10 | Automated tests cover the scary cases | `tests/unit/*.test.ts` (6 files), `tests/integration/*.test.ts` (2 files), `tests/e2e/probe*.test.ts` (4 files) | This table | **12 test files exist, written, not executed here.** `npm test` for everything once provisioned. |
| 11 | README + architecture diagram + setup instructions; everything runs against the fake platform; submission files present | `README.md` (11 Mermaid diagrams), `docs/*.md` | Read the files | **Done, verifiable now by reading them.** All required files present: `README.md`, `capstone.yaml`, `EVIDENCE.md` (this file), `BUILDLOG.md`, `.env.example`, `.gitignore`, `LICENSE`. |

## Acceptance probes (brief §12, Layer 2)

| Probe | Expected | Status |
|---|---|---|
| 1 — publish same campaign twice + retry after timeout → 1 post/platform | Test: `tests/integration/idempotent-publish.test.ts` | BLOCKED — needs live infra, see row 5 above |
| 2 — 429 + Retry-After: 30 → wait, retry, succeed | Test: `tests/e2e/probe2-rate-limit.test.ts` | BLOCKED — see row 6 |
| 3 — schedule, kill worker mid-batch, restart → 0 duplicates | Automated proxy: `tests/e2e/probe3-crash-recovery.test.ts`; literal kill: manual demo step | BLOCKED (automated), manual step documented in README |
| 4 — forged webhook → 400/unchanged; valid → published | Test: `tests/integration/webhook-verification.test.ts` | BLOCKED — see row 8 |
| 5 — Instagram 1080×1080, X 1600×900, distinct captions | Test: `tests/e2e/probe5-artifacts.test.ts` | BLOCKED — see row 1/2 |
| 6 — no plaintext token in DB/logs | Test: `tests/e2e/probe6-no-plaintext-tokens.test.ts` | BLOCKED — see row 4 |

## Code quality gates (§36)

| Gate | Status |
|---|---|
| `npm run lint` | **BLOCKED** — `npm install` unavailable in this sandbox |
| `npm run typecheck` | **BLOCKED** — same |
| `npm test` | **BLOCKED** — same |
| `npm run build` | **BLOCKED** — same |

## What IS verifiable right now, without any infra

- Every file in this repository can be read and reviewed for correctness — that's real
  evidence a reviewer can act on today.
- The architectural claim (no platform-specific branching outside `infrastructure/platforms/`)
  is `grep`-able and stated in row 3 above with the exact command.
- The database schema's invariants (unique constraints, foreign keys) are readable directly in
  `prisma/migrations/000001_init/migration.sql` — no live database needed to confirm they're
  declared correctly, only to confirm they hold under load.

## Next steps for a human running this for real

```bash
git init && git add -A && git commit -m "chore: initialize capstone repository"
cp .env.example .env
# fill in ENCRYPTION_KEY / WEBHOOK_SECRET as described in docs/development.md
export WEBHOOK_SECRET=<same value>
docker compose up --build
docker compose exec api npm run db:migrate
docker compose exec api npm run db:seed
docker compose exec api npm test
```

Then replace every `BLOCKED` above with the actual command output (paste it into this file),
and capture the 15 screenshots listed in the README.
