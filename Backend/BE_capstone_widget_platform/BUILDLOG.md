# BUILDLOG.md

Honest log of where AI helped, where it was wrong, and what was changed.
Per the brief's rule: **"The AI wrote it" is not an answer** at demo time —
the evaluator will pick 2–3 lines and ask you to explain them. Read the code,
don't just ship it.

---

## What AI did in this build

Claude (Anthropic) generated the initial end-to-end implementation from the
capstone brief in one session: the Express app, the SQLite schema and
repository layer, all five route modules, the CORS/rate-limit/validation
middleware, the geo-enrichment fallback chain, the safe email side effect,
the vanilla-JS embed bundle, and the Jest/Supertest test suite (37 tests).
The suite was run and two real bugs it introduced were caught and fixed
before delivery — see below.

## Where AI got it wrong (and how it was caught)

1. **CORS preflight was silently bypassed.** The first version registered
   `router.post('/widgets/:id/submissions', widgetCors, ...)` and assumed
   Express would route `OPTIONS` requests through `widgetCors` too. It
   doesn't — Express auto-generates a bare `200 OPTIONS` responder for any
   path that has other method handlers, and that default responder runs
   *before* route-specific middleware, so the origin allow-list check never
   fired on preflight. Caught by `tests/cors-and-config.test.js` expecting
   `204`/`403` and getting `200` instead. Fixed by explicitly registering
   `router.options('/widgets/:id/submissions', widgetCors)`.

2. **Rate-limit test env leaked across test files.** The first version put
   a low `RATE_LIMIT_IP_MAX=5` in the shared Jest `setupFiles`, which every
   test file inherited — so unrelated tests in `submissions.test.js`
   accumulated hits against the same in-memory bucket and one test failed
   non-deterministically depending on execution order. Fixed by keeping the
   shared setup at production defaults and having only
   `tests/rate-limit.test.js` lower the threshold for itself (each Jest test
   file gets its own isolated module registry, so this doesn't leak).

## What was verified, not just trusted

- `npm install` run clean, no unresolved peer dependency issues.
- `npm test` run to a full 37/37 pass after the two fixes above — not just
  read and assumed correct.
- The server was actually booted (`node src/server.js`), seeded
  (`npm run seed`), and hit with real `curl` requests against `/health` and
  `/public/widgets/:id/config` to confirm the SQLite file, schema, and
  routing work outside the test harness too.

## What to do before your demo (fill this in as you go)

- [ ] Read `src/modules/public/public.routes.js` line by line — this is the
      file most likely to get picked apart at demo time.
- [ ] Read `src/services/geo.service.js` and `src/services/email.service.js`
      and be ready to explain, in your own words, why neither function can
      throw an exception that reaches the submission handler.
- [ ] Pick one PATCH/validation edge case in `src/utils/validation.js` and
      trace it through manually with curl, not just via the test suite.
- [ ] Note here any change **you** make from this point forward, with a
      one-line reason — that's what makes this log honest.

---

*Add entries below as the project evolves past this initial build.*
