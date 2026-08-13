"""
verify_core_logic.py — sandbox verification, NOT a substitute for `pytest`.

This repo's real test suite is tests/ (pytest, run via `docker compose exec
app pytest` or locally with the requirements.txt installed). This script
exists because the environment that authored this repo had no network
access to install fastapi/sqlalchemy/pytest, so it could not literally run
`pytest`. To still produce genuine, executed evidence (not just written
code), this script:

  1. Imports and exercises the REAL production modules that have zero
     third-party dependencies — app/pricing.py, app/services/cost_service.py,
     app/services/quota_service.py, and the two payment adapters (their
     signature verification uses only hmac/hashlib/json/time from stdlib).
  2. Re-implements the exact same "INSERT, catch uniqueness violation"
     idempotency pattern used in app/services/metering_service.py, using
     Python's builtin sqlite3 module (metering_service.py itself imports
     SQLAlchemy and can't be run here) — proving the *pattern* is sound
     with a real database enforcing a real UNIQUE constraint, not a mock.

Run with: python3 scripts/verify_core_logic.py
"""

import hashlib
import hmac
import json
import os
import sqlite3
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.pricing import TOKEN_PRICING, API_CALL_PRICING  # noqa: E402
from app.services.cost_service import CostService, TokenUsage  # noqa: E402
from app.services.quota_service import QuotaDecision, QuotaService  # noqa: E402
from app.services.adapters.stripe_adapter import StripeAdapter  # noqa: E402
from app.services.adapters.local_mock_adapter import LocalMockAdapter  # noqa: E402
from app.services.adapters.base import SignatureVerificationError  # noqa: E402

PASS = 0
FAIL = 0


def check(label, condition):
    global PASS, FAIL
    status = "PASS" if condition else "FAIL"
    if condition:
        PASS += 1
    else:
        FAIL += 1
    print(f"[{status}] {label}")


print("=" * 70)
print("1. COST ENGINE — pinned pricing, real app.services.cost_service code")
print("=" * 70)

usage = TokenUsage(standard_input_tokens=100, cached_input_tokens=100, output_tokens=100, reasoning_tokens=100)
expected = (
    100 * TOKEN_PRICING.standard_input_micro_cents_per_token
    + 100 * TOKEN_PRICING.cached_input_micro_cents_per_token
    + (100 + 100) * TOKEN_PRICING.output_micro_cents_per_token
)
actual = CostService.price_tokens(usage)
check(f"mixed categories priced independently & summed: got {actual}, expected {expected}", actual == expected)

cached_cost = CostService.price_tokens(TokenUsage(cached_input_tokens=1000))
standard_cost = CostService.price_tokens(TokenUsage(standard_input_tokens=1000))
check(f"cached input cheaper than standard input ({cached_cost} < {standard_cost})", cached_cost < standard_cost)

reasoning_cost = CostService.price_tokens(TokenUsage(reasoning_tokens=500))
output_cost = CostService.price_tokens(TokenUsage(output_tokens=500))
check(f"reasoning tokens priced same as output ({reasoning_cost} == {output_cost})", reasoning_cost == output_cost)

check("all costs are int, never float", isinstance(actual, int) and not isinstance(actual, float))

try:
    CostService.price_api_calls(-1)
    check("negative call count rejected", False)
except ValueError:
    check("negative call count rejected", True)


print()
print("=" * 70)
print("2. QUOTA BOUNDARY — 999 / 1000 / 1001, real app.services.quota_service code")
print("=" * 70)

r999 = QuotaService.check(current_usage=999, requested_qty=1, limit=1000, subscription_status="active")
check(f"999 used + 1 request -> ALLOWED (this is call #1000): {r999.decision}", r999.decision == QuotaDecision.ALLOWED)

r1000 = QuotaService.check(current_usage=1000, requested_qty=1, limit=1000, subscription_status="active")
check(f"1000 used + 1 request -> 429 quota_exceeded (this is call #1001): {r1000.decision}",
      r1000.decision == QuotaDecision.QUOTA_EXCEEDED)

r_pastdue = QuotaService.check(current_usage=0, requested_qty=1, limit=1000, subscription_status="past_due")
check(f"past_due subscription -> 402 payment_required regardless of quota: {r_pastdue.decision}",
      r_pastdue.decision == QuotaDecision.PAYMENT_REQUIRED)

print(f"    quota_exceeded error body: {json.dumps(r1000.to_error_body())}")


print()
print("=" * 70)
print("3. WEBHOOK SIGNATURES — real adapter code, hmac/hashlib stdlib only")
print("=" * 70)

STRIPE_SECRET = "whsec_test_secret"
stripe_adapter = StripeAdapter(api_key="sk_test", webhook_secret=STRIPE_SECRET, price_id_pro="price_1")

payload = {"id": "evt_1", "type": "checkout.session.completed",
           "data": {"object": {"client_reference_id": "tenant-1", "customer": "cus_1", "subscription": "sub_1"}}}
raw_body = json.dumps(payload).encode()
timestamp = str(int(time.time()))
good_sig = StripeAdapter.compute_signature(secret=STRIPE_SECRET, timestamp=timestamp, raw_body=raw_body)
good_header = f"t={timestamp},v1={good_sig}"

event = stripe_adapter.verify_and_parse_webhook(raw_body, good_header)
check(f"valid Stripe signature verifies, event_id={event.event_id}", event.event_id == "evt_1")

bad_header = f"t={timestamp},v1=" + "0" * 64
try:
    stripe_adapter.verify_and_parse_webhook(raw_body, bad_header)
    check("forged Stripe signature raises SignatureVerificationError", False)
except SignatureVerificationError as e:
    check(f"forged Stripe signature raises SignatureVerificationError ({e})", True)

LOCAL_SECRET = "local_test_secret"
local_adapter = LocalMockAdapter(webhook_secret=LOCAL_SECRET)
local_raw, local_sig = LocalMockAdapter.build_signed_event(
    secret=LOCAL_SECRET, event_type="subscription.activated", tenant_id="tenant-1"
)
local_event = local_adapter.verify_and_parse_webhook(local_raw, local_sig)
check(f"valid local-mock HMAC-SHA256 signature verifies, event_type={local_event.event_type}",
      local_event.event_type == "subscription.activated")

forged_local_sig = "sha256=" + "1" * 64
try:
    local_adapter.verify_and_parse_webhook(local_raw, forged_local_sig)
    check("forged local-mock signature raises SignatureVerificationError", False)
except SignatureVerificationError as e:
    check(f"forged local-mock signature raises SignatureVerificationError ({e})", True)


print()
print("=" * 70)
print("4. IDEMPOTENCY PATTERN — same INSERT-and-catch-uniqueness-violation")
print("   pattern as app/services/metering_service.py, run against a real")
print("   sqlite3 database with the same UNIQUE(tenant_id, key) constraint")
print("   defined in migrations/schema.sql (translated from Postgres->SQLite)")
print("=" * 70)

conn = sqlite3.connect(":memory:")
conn.execute("""
    CREATE TABLE usage_events (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        idempotency_key TEXT NOT NULL,
        api_call_qty INTEGER NOT NULL,
        UNIQUE(tenant_id, idempotency_key)
    )
""")


def record(tenant_id, key, qty, row_id):
    """Mirrors MeteringService.record(): always attempt INSERT, treat a
    uniqueness violation as 'already recorded', SELECT the winning row."""
    try:
        conn.execute(
            "INSERT INTO usage_events (id, tenant_id, idempotency_key, api_call_qty) VALUES (?, ?, ?, ?)",
            (row_id, tenant_id, key, qty),
        )
        conn.commit()
        return "created"
    except sqlite3.IntegrityError:
        return "duplicate"


results = [record("tenant-A", "retry-key-1", 500, f"row-{i}") for i in range(5)]
check(f"5 retries of the same idempotency key -> outcomes {results}",
      results == ["created", "duplicate", "duplicate", "duplicate", "duplicate"])

count = conn.execute(
    "SELECT COUNT(*) FROM usage_events WHERE tenant_id='tenant-A' AND idempotency_key='retry-key-1'"
).fetchone()[0]
check(f"exactly ONE row exists in the database after 5 retries: count={count}", count == 1)

total_qty = conn.execute(
    "SELECT SUM(api_call_qty) FROM usage_events WHERE tenant_id='tenant-A'"
).fetchone()[0]
check(f"tenant's total usage is 500, not 2500 (5 x 500) — no double counting: total={total_qty}", total_qty == 500)

# Same key, different tenant — must NOT collide, matching UNIQUE(tenant_id, key)
r_other_tenant = record("tenant-B", "retry-key-1", 1, "row-other-tenant")
check(f"same key, DIFFERENT tenant -> not a duplicate (scoped per-tenant): {r_other_tenant}",
      r_other_tenant == "created")

conn.close()

print()
print("=" * 70)
print(f"RESULT: {PASS} passed, {FAIL} failed")
print("=" * 70)
sys.exit(1 if FAIL else 0)
