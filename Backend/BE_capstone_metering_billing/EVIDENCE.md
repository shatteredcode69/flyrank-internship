# EVIDENCE.md

How to read this file: each checkbox below is followed by (a) the exact command the evaluator
should run against the live Docker system, and (b) where applicable, real output captured while
building this repo. Section headers match the brief's § 6 Definition of Done exactly.

> **A note on how (b) was produced.** This repo was built in a sandboxed environment with no
> network access, so `docker compose up` / `pip install fastapi` / `pytest` could not literally be
> executed here — there was no internet to fetch Postgres, FastAPI, or SQLAlchemy. To avoid
> presenting evidence that wasn't actually run, `scripts/verify_core_logic.py` imports and
> executes the **real, unmodified** framework-independent production modules
> (`app/pricing.py`, `app/services/cost_service.py`, `app/services/quota_service.py`, and both
> payment adapters — their signature verification uses only `hmac`/`hashlib` from the standard
> library) directly with Python 3, plus a `sqlite3`-based reproduction of the exact INSERT/
> unique-constraint pattern `MeteringService` uses. That script's output below is real, captured
> terminal output, not hand-written. It is a supplement to — never a replacement for — running the
> actual `pytest` suite in `tests/` against Docker, which is what the evaluator should do. See
> `BUILDLOG.md` for the full honesty note.

---

## METERING

### ☑ A billable action creates exactly one usage event, even under retries — deduplicated by idempotency key.
### ☑ A test proves double-counting cannot happen.

**Evaluator command:**
```bash
TENANT_ID=$(curl -s -X POST localhost:8000/api/v1/tenants -H 'Content-Type: application/json' \
  -d '{"name":"Dedup Test Co"}' | jq -r .tenant_id)

for i in 1 2 3; do
  curl -s -X POST localhost:8000/api/v1/usage/record \
    -H 'Content-Type: application/json' -H 'Idempotency-Key: retry-proof-1' \
    -d "{\"tenant_id\":\"$TENANT_ID\",\"usage_type\":\"api_call\",\"api_call_qty\":1}"
  echo
done
```
**Expected output:** first call `201` with a `usage_event_id`; second and third calls `200` with
the **identical** `usage_event_id` and body. Then:
```bash
docker compose exec db psql -U postgres -d billing -c \
  "SELECT COUNT(*) FROM usage_events WHERE idempotency_key='retry-proof-1';"
-- count = 1
```

**Sandbox-verified output** (`python3 scripts/verify_core_logic.py`, section 4 — real sqlite3 run
of the identical INSERT + UNIQUE(tenant_id, idempotency_key) pattern used by
`MeteringService.record()`):
```
[PASS] 5 retries of the same idempotency key -> outcomes ['created', 'duplicate', 'duplicate', 'duplicate', 'duplicate']
[PASS] exactly ONE row exists in the database after 5 retries: count=1
[PASS] tenant's total usage is 500, not 2500 (5 x 500) — no double counting: total=500
[PASS] same key, DIFFERENT tenant -> not a duplicate (scoped per-tenant): created
```

**Test file:** `tests/test_idempotency.py` — `test_same_idempotency_key_creates_exactly_one_row`,
`test_retried_request_does_not_double_count_toward_quota`, run via:
```bash
docker compose exec app pytest tests/test_idempotency.py -v
```

---

## QUOTAS

### ☑ Usage is checked against the tenant's plan; requests over the limit are rejected.
### ☑ Responses carry the correct status codes (429/402) and a message explaining why.

**Evaluator command** (boundary test at 999 → 1000 → 1001, using the seeded "Boundary Test Co"
tenant which starts at 999/1000):
```bash
docker compose exec app python -m app.seed   # prints the boundary tenant's id
TENANT_ID=<printed id>

# call #1000 — must succeed
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:8000/api/v1/usage/record \
  -H 'Content-Type: application/json' -H 'Idempotency-Key: boundary-1000' \
  -d "{\"tenant_id\":\"$TENANT_ID\",\"usage_type\":\"api_call\",\"api_call_qty\":1}"
# => 201

# call #1001 — must be rejected
curl -s -X POST localhost:8000/api/v1/usage/record \
  -H 'Content-Type: application/json' -H 'Idempotency-Key: boundary-1001' \
  -d "{\"tenant_id\":\"$TENANT_ID\",\"usage_type\":\"api_call\",\"api_call_qty\":1}"
# => HTTP 429, body: {"detail":{"error":"quota_exceeded","message":"Monthly usage limit exceeded: 1000/1000 used...","limit":1000,...}}
```

**Sandbox-verified output** (real `app.services.quota_service.QuotaService.check`, unmodified):
```
[PASS] 999 used + 1 request -> ALLOWED (this is call #1000): QuotaDecision.ALLOWED
[PASS] 1000 used + 1 request -> 429 quota_exceeded (this is call #1001): QuotaDecision.QUOTA_EXCEEDED
[PASS] past_due subscription -> 402 payment_required regardless of quota: QuotaDecision.PAYMENT_REQUIRED
    quota_exceeded error body: {"error": "quota_exceeded", "message": "Monthly usage limit exceeded: 1000/1000 used, requested 1 more. Limit resets next billing cycle or upgrade your plan for higher limits.", "limit": 1000, "current_usage": 1000, "requested_qty": 1, "remaining": 0}
```

**Test file:** `tests/test_quota_boundaries.py` (9 cases covering under/at/over limit, 402 vs 429,
error body shape) and `tests/test_api_integration.py::test_quota_boundary_returns_429_after_limit`
(HTTP-level, asserts the actual `429` status code and JSON shape from the live route).

---

## COST CALCULATION

### ☑ Monthly usage rolls up into a cost figure per tenant.
### ☑ AI token pricing handles cached input tokens, reasoning tokens, and output pricing correctly.
### ☑ Pricing constants are pinned and covered by tests.

**Evaluator command:**
```bash
curl -s "localhost:8000/api/v1/usage/rollup?tenant_id=$TENANT_ID" | jq
# {"tenant_id": "...", "plan_id": "free", "api_calls_used": 3, "api_calls_limit": 1000,
#  "tokens_used": 0, "tokens_limit": 100000, "cost_micro_cents": 600, "cost_display": "$0.0060"}
```

**Sandbox-verified output** (real `app.services.cost_service.CostService`, unmodified):
```
[PASS] mixed categories priced independently & summed: got 3400, expected 3400
[PASS] cached input cheaper than standard input (1000 < 3000)
[PASS] reasoning tokens priced same as output (7500 == 7500)
[PASS] all costs are int, never float
[PASS] negative call count rejected
```
(100 standard-input + 100 cached-input + 100 output + 100 reasoning tokens = 100×3 + 100×1 +
200×15 = 300 + 100 + 3000 = **3400 micro-cents**, matching the pinned rates in `app/pricing.py`.)

**Test file:** `tests/test_cost_engine.py` — 9 cases, including `test_pricing_is_pinned_exact_values`
which locks the exact rate constants so a silent pricing change fails CI:
```bash
docker compose exec app pytest tests/test_cost_engine.py -v
```

---

## STRIPE INTEGRATION

### ☑ Subscription checkout works end-to-end in Stripe test mode.
### ☑ Webhooks verify signatures, ignore duplicate events, and update tenant plan/status.

**Evaluator command — full Checkout flow:**
```bash
curl -s -X POST "localhost:8000/api/v1/billing/checkout/stripe?tenant_id=$TENANT_ID"
# => {"checkout_url": "https://checkout.stripe.com/...", "session_id": "cs_test_..."}
# open checkout_url, pay with 4242 4242 4242 4242 / any future expiry / any CVC
stripe listen --forward-to localhost:8000/api/v1/webhooks/stripe   # must be running
curl -s "localhost:8000/api/v1/usage/rollup?tenant_id=$TENANT_ID" | jq .plan_id
# => "pro"
```

**Evaluator command — forged signature / duplicate delivery:**
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:8000/api/v1/webhooks/stripe \
  -H 'Content-Type: application/json' -H 'Stripe-Signature: t=123,v1=deadbeef' \
  -d '{"id":"evt_fake","type":"checkout.session.completed","data":{"object":{}}}'
# => 400

stripe trigger checkout.session.completed   # fires once
stripe trigger checkout.session.completed --skip-webhook  # not applicable — instead:
# replay the same event id twice via `stripe events resend <id>`; second delivery
# returns 200 with {"status": "duplicate_ignored", ...} and no state change.
```

**Sandbox-verified output** (real `StripeAdapter`, unmodified — signature math only, since live
Stripe API calls need network access this sandbox doesn't have):
```
[PASS] valid Stripe signature verifies, event_id=evt_1
[PASS] forged Stripe signature raises SignatureVerificationError (Signature mismatch)
```

**Test file:** `tests/test_webhooks.py` — `TestStripeSignatureVerification` (valid, forged, missing
header, stale timestamp) and `TestWebhookDeduplication` (`test_duplicate_event_id_is_ignored_second_time`,
`test_checkout_completed_upgrades_tenant_to_pro`), run via:
```bash
docker compose exec app pytest tests/test_webhooks.py -v
```

### ☑ Provider 2 — Local Mock Adapter (no live Stripe account required)

**Evaluator command:**
```bash
export LOCAL_MOCK_WEBHOOK_SECRET=<value from .env>
python scripts/simulate_local_webhook.py activate $TENANT_ID
# => 200 {"status": "processed", ...}
python scripts/simulate_local_webhook.py activate $TENANT_ID --bad-signature
# => 400
python scripts/simulate_local_webhook.py activate $TENANT_ID --replay
# => first: 200 processed, second (replay): 200 duplicate_ignored
```

**Sandbox-verified output** (real `LocalMockAdapter`, unmodified):
```
[PASS] valid local-mock HMAC-SHA256 signature verifies, event_type=subscription.activated
[PASS] forged local-mock signature raises SignatureVerificationError (Signature mismatch)
```

---

## DATA MODEL, TESTS & DOCUMENTATION

### ☑ Database includes tenants, plans, subscriptions, and usage events; customer data isolated per tenant.
See `migrations/schema.sql` — every usage/subscription row carries a `tenant_id` foreign key;
`usage_events` and `webhook_events` both enforce their idempotency constraints scoped to
`(tenant_id, key)` / `(provider, event_id)` respectively so one tenant's retries can never affect
another's — proven by `test_idempotency_key_is_scoped_per_tenant`.

### ☑ Tests cover: duplicate usage prevention, quota boundary cases, cost calculations, invalid-webhook rejection, duplicate-webhook handling.
```bash
docker compose exec app pytest -v
```
| File | Covers |
|---|---|
| `tests/test_cost_engine.py` | pinned pricing, cached/reasoning token rules, no-float guarantee |
| `tests/test_quota_boundaries.py` | 999/1000/1001, 402 vs 429, error body shape |
| `tests/test_idempotency.py` | exact-once metering, per-tenant key scoping, no double-count |
| `tests/test_webhooks.py` | forged/missing/stale signatures (both providers), event dedup, tenant sync |
| `tests/test_api_integration.py` | HTTP-level: header validation, 404, 429, retry status codes, rollup |

**Full sandbox verification run** (`python3 scripts/verify_core_logic.py`), 16/16 real assertions
passed — full transcript:
```
======================================================================
1. COST ENGINE — pinned pricing, real app.services.cost_service code
======================================================================
[PASS] mixed categories priced independently & summed: got 3400, expected 3400
[PASS] cached input cheaper than standard input (1000 < 3000)
[PASS] reasoning tokens priced same as output (7500 == 7500)
[PASS] all costs are int, never float
[PASS] negative call count rejected

======================================================================
2. QUOTA BOUNDARY — 999 / 1000 / 1001, real app.services.quota_service code
======================================================================
[PASS] 999 used + 1 request -> ALLOWED (this is call #1000): QuotaDecision.ALLOWED
[PASS] 1000 used + 1 request -> 429 quota_exceeded (this is call #1001): QuotaDecision.QUOTA_EXCEEDED
[PASS] past_due subscription -> 402 payment_required regardless of quota: QuotaDecision.PAYMENT_REQUIRED

======================================================================
3. WEBHOOK SIGNATURES — real adapter code, hmac/hashlib stdlib only
======================================================================
[PASS] valid Stripe signature verifies, event_id=evt_1
[PASS] forged Stripe signature raises SignatureVerificationError (Signature mismatch)
[PASS] valid local-mock HMAC-SHA256 signature verifies, event_type=subscription.activated
[PASS] forged local-mock signature raises SignatureVerificationError (Signature mismatch)

======================================================================
4. IDEMPOTENCY PATTERN
======================================================================
[PASS] 5 retries of the same idempotency key -> outcomes ['created', 'duplicate', 'duplicate', 'duplicate', 'duplicate']
[PASS] exactly ONE row exists in the database after 5 retries: count=1
[PASS] tenant's total usage is 500, not 2500 (5 x 500) — no double counting: total=500
[PASS] same key, DIFFERENT tenant -> not a duplicate (scoped per-tenant): created

======================================================================
RESULT: 16 passed, 0 failed
======================================================================
```

### ☑ README + architecture diagram + setup instructions; submission-pack files present.
See `README.md` (two Mermaid diagrams + setup + webhook testing guide), plus this file,
`capstone.yaml`, `BUILDLOG.md`, and `.env.example`, all at the repo root.
