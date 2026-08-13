# Testing

Three layers, per §21:

- **`tests/unit/`** — pure logic, no I/O beyond the local filesystem: backoff math, webhook
  signature verification, AES-GCM round-trip, deterministic idempotency-key generation, the
  `SocialPost` state machine, caption composition, and image-variant *dimensions* (using a
  synthetic in-memory source image via Sharp — no network, no external services).
- **`tests/integration/`** — real Postgres + Redis + the fake-platform HTTP server, exercised
  through the actual use cases (`createCampaign`, `publishSocialPost`,
  `handleSocialDeliveryWebhook`). These `describe.runIf(await isDatabaseReachable())`-guard
  themselves: if the infra isn't up, they report as **skipped**, never as a false pass.
- **`tests/e2e/`** — one file per capstone acceptance probe (`tests/e2e/probe*.test.ts`),
  described further in `EVIDENCE.md`.

## Running

```bash
docker compose exec api npm test              # everything
docker compose exec api npm run test:unit     # fast, no infra dependency
docker compose exec api npm run test:integration
docker compose exec api npm run test:e2e
```

## A note on Probe 3 (crash recovery)

Vitest cannot meaningfully `kill -9` and restart its own worker process mid-test. The
automated version in `tests/e2e/probe3-crash-recovery.test.ts` verifies the two properties
that make real crash recovery safe (the recovery-sweep query finds an orphaned due post; a
second publish call after a first one "landed" produces zero duplicates) without literally
restarting a process. The literal restart is a manual demo step — see README → 6-Minute Demo,
step 6, and is the one probe evidence in `EVIDENCE.md` explicitly marks as
"process-level, captured manually" rather than claiming an automated test proves it end to end.
