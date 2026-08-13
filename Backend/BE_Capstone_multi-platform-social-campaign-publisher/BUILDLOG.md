# Build Log

This project was built by Claude (Anthropic), acting on a detailed master build prompt plus
the attached FlyRank capstone brief PDF, in a single guided chat session on 2026-08-14.
Documented honestly per the brief's Rule 4 ("AI-assisted building is encouraged — and owned").

## Phase 0 — Repository reconnaissance

**Task:** Locate and inspect the starter repository, the fake platform server, and the
FlyRank reference files cited by the brief (`config/social-prompts.config.ts`,
`types/content.types.ts`, `inngest/generateImageForContent.ts`,
`lib/dynamic-image-variants/`, `app/api/webhooks/stripe/route.ts`, `lib/serverUtils.ts`).

**What AI did:** Ran `ls`/`find` across `/mnt/user-data/uploads` and the working sandbox.

**Result:** None of those files exist anywhere in the workspace — only the PDF brief itself was
uploaded. Also checked tool availability: Node 22 and npm 10 are present; Docker, PostgreSQL,
and Redis binaries are **not installed**, and outbound network access (needed for `npm install`,
since none of the required packages — Express, Prisma, BullMQ, Sharp, Vitest, etc. — are
pre-installed) returned `403` from the egress proxy.

**What was accepted:** Proceeding to build the entire system from scratch, including a
from-scratch fake social platform server, with all code written to run correctly in a properly
provisioned environment (Docker + Postgres + Redis + network), rather than attempting to fake
around the sandbox's limitations.

**What was rejected:** Any temptation to report `npm test` or `docker compose up` as
"executed successfully" when they were not — see EVIDENCE.md for how this is handled
transparently instead.

## Phase 1 — Architecture and foundation

**AI suggested:** The layered structure (`domain/application/infrastructure/interfaces`)
directly matching the master prompt's §5/§6, plus the `SocialPublisher` port-and-adapter
pattern as the one interface the application layer depends on.

**What was accepted:** The structure as proposed — it maps cleanly onto both the capstone
brief's requirements and standard hexagonal-architecture practice.

**What was changed:** None — the human directed "build the whole repo now, include the fake
platform server," and the proposed architecture was used as specified.

**Tests performed:** None executable in this sandbox (no Postgres/Redis). Static review only:
re-read every file after writing it for import correctness and internal consistency.

**Result:** Repository skeleton, `package.json`, `tsconfig.json`, ESLint/Prettier config,
Prisma schema + hand-verified SQL migration, `.env.example`, Docker/Compose files.

## Phase 2 — Content pipeline

**AI suggested:** A single data-driven `generateVariant()` function keyed off
`PLATFORM_IMAGE_SPECS`, using Sharp's `fit: 'cover'` + `position: 'attention'` for safe-zone
cropping; caption composition as `sharedBrandVoice + platformRules + contentSummary` fragments
composed into one function rather than per-platform prompt strings.

**What was accepted:** Both as designed.

**Tests performed:** `tests/unit/image-variant.test.ts` and
`tests/unit/caption-composition.test.ts` were written and are believed correct on inspection
(they use only Sharp against a synthetic in-memory source image, so they would run without
Docker if `npm install` succeeded), but were **not actually executed** — `npm install` cannot
reach the registry in this sandbox. Status: written, not run. See EVIDENCE.md.

## Phase 3 — Publishing system

**AI suggested:** Centralizing 429/backoff handling in one shared HTTP client
(`fake-platform-http-client.ts`) used by both adapters, rather than duplicating retry logic per
adapter; an `IdempotencyRecord` table consulted *before* any platform call, so a retry after a
timeout never re-fires a publish that may have already landed.

**What was accepted:** Both as designed — this directly targets the brief's stated hardest
requirement (idempotency under retries).

**What was changed:** An initial draft had the idempotency check live only in
`SocialPostRepository` (checking `externalPostId` is set). This was revised to a dedicated
`IdempotencyRecord` table with its own `IN_FLIGHT`/`COMPLETED`/`FAILED` states, because the
original approach couldn't distinguish "never attempted" from "attempted, response lost to a
timeout" — exactly the case the brief calls out as the hard one.

**Tests performed:** `tests/integration/idempotent-publish.test.ts` and
`tests/e2e/probe2-rate-limit.test.ts` written, requiring live Postgres + Redis +
fake-platform — **not executed** in this sandbox. Guarded with
`describe.runIf(await isDatabaseReachable())` so a real run against real infra reports
skip-vs-pass honestly rather than silently no-op'ing.

## Phase 4 — Reliability

**AI suggested:** Two independent scheduling mechanisms — a BullMQ worker for the fast path,
plus a 15-second Postgres recovery sweep as the actual durable source of truth — so that a
worker crash, a lost Redis job, or a worker being down at the scheduled moment are all covered
by the same idempotent `publishSocialPost` call.

**What was accepted:** As designed.

**Tests performed:** `tests/e2e/probe3-crash-recovery.test.ts`,
`tests/integration/webhook-verification.test.ts`,
`tests/e2e/probe5-artifacts.test.ts`, `tests/e2e/probe6-no-plaintext-tokens.test.ts` written,
not executed (same sandbox constraint). `tests/unit/*` (backoff, webhook-signature,
token-cipher, idempotency-key, social-post-status) are self-contained with no external
dependencies and are the most likely to run correctly first-try in a provisioned environment,
but were still not executed here.

## Phase 5 — Documentation/demo

**AI suggested:** Marking every unexecuted claim explicitly rather than writing a
conventionally confident README. The human's original master prompt explicitly requires this
("Never claim a feature is implemented unless it actually exists and has been tested" / "Never
claim acceptance probes pass without executing them").

**What was accepted:** README, all `docs/*.md`, `EVIDENCE.md`, and `capstone.yaml` all say
plainly, in multiple places, that this sandbox could not execute the project, and that
verification is the next human step.

## Honest summary of what AI assistance did NOT do

- Did not run `npm install`, `docker compose up`, `npm run db:migrate`, `npm run db:seed`,
  `npm test`, `npm run lint`, or `npm run typecheck` — network/Docker were unavailable.
- Did not capture any of the 15 screenshots listed in the README — nothing was ever actually
  running to screenshot.
- Did not literally kill and restart a worker process for Probe 3 — see `docs/testing.md` for
  what the automated proxy for that probe does and does not prove.

Every one of these is reproduced as an explicit `BLOCKED` entry in `EVIDENCE.md` with the exact
command a human should run next.
