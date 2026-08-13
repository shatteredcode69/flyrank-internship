# EVIDENCE.md

One pasted proof per Definition-of-Done checkbox (brief §6). Paste real
command output, curl transcripts, or screenshots as you finish each item —
not all at once at the end. See README § "Screenshots to capture" for what
to shoot and why.

---

## Widget management

- [ ] **Authenticated CRUD; unauthenticated requests rejected**
  <!-- paste: curl POST /api/widgets with no Authorization header -> 401 -->

- [ ] **Multi-tenant isolation proven**
  <!-- paste: tests/widgets.test.js "multi-tenant isolation" results, or a
       manual curl showing tenant B getting 404 on tenant A's widget id -->

## Widget delivery

- [ ] **Embed snippet generated per widget**
  <!-- paste: GET /api/widgets/:id/embed response -->

- [ ] **Public config endpoint, correct cache headers**
  <!-- paste: curl -i GET /public/widgets/:id/config, showing Cache-Control + ETag -->

- [ ] **Widget JS served as a versioned bundle**
  <!-- paste: curl -i GET /widget/v1/widget.js, showing Cache-Control: immutable -->

- [ ] **Widget renders on a different-origin page**
  <!-- paste: screenshot of localhost:5500 with the widget visible -->

## Public submission API

- [ ] **Cross-origin submissions work; preflight handled**
  <!-- paste: DevTools Network tab screenshot of the OPTIONS request + response headers -->

- [ ] **Malformed/oversized payloads rejected with clean 4xx**
  <!-- paste: curl showing 400 for bad shape AND 413 for oversized body -->

- [ ] **Valid submissions stored, linked to the right widget/tenant**
  <!-- paste: dashboard submissions list showing the new row -->

## Abuse protection

- [ ] **Rate limiting returns 429 under burst; legitimate traffic keeps flowing**
  <!-- paste: npm test output for tests/rate-limit.test.js, or a curl loop -->

- [ ] **Spam control demonstrably blocks a spam submission**
  <!-- paste: curl with website="something" -> 201 {status:"discarded"}, then
       dashboard list showing it's NOT there -->

## Enrichment & safe side effects

- [ ] **Provider fallback chain: A down → B answers**
  <!-- paste: POST /debug/providers/A/toggle {"status":"down"}, then a submission
       response/DB row showing geo_provider: "ipapi.co" -->

- [ ] **Both providers down → submission still succeeds, no geo**
  <!-- paste: toggle both off, submission still 201, geo fields null -->

- [ ] **Failing email/webhook does not prevent storage**
  <!-- paste: POST /debug/email/toggle {"status":"down"}, submission still 201 -->

## Tests & documentation

- [ ] **Automated tests cover CORS preflight, invalid payload, oversized
      payload, rate limiting, spam control, provider fallback, widget
      rendering**
  <!-- paste: full `npm test` output, 37 passed -->

- [ ] **README with architecture diagram, setup, API docs present**
  <!-- this file's sibling, README.md, satisfies this box -->

---

*Claims without evidence score as not done — fill in the checkboxes above as
you go through the demo script in README.md § "Demo script."*
