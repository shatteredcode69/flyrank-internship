"""
Stripe adapter (test mode only — see .env.example / README).

Signature verification is implemented by hand against Stripe's documented
scheme rather than delegating to the `stripe` SDK, so the security-critical
path has no hidden behaviour and is fully unit-testable with nothing but
`hmac`/`hashlib` from the standard library (see tests/test_webhooks.py).

Stripe's Stripe-Signature header looks like:
    t=1699999999,v1=5257a869e7...,v0=...
We only need to check the v1 scheme:
    signed_payload = f"{timestamp}.{raw_body}"
    expected = hmac_sha256_hex(webhook_secret, signed_payload)
    valid if expected matches any v1 value AND timestamp is recent (anti-replay tolerance).
"""

import hashlib
import hmac
import json
import time

from app.services.adapters.base import PaymentAdapter, SignatureVerificationError, VerifiedEvent

DEFAULT_TOLERANCE_SECONDS = 300  # Stripe's own default replay tolerance


class StripeAdapter(PaymentAdapter):
    provider_name = "stripe"

    def __init__(self, *, api_key: str, webhook_secret: str, price_id_pro: str,
                 tolerance_seconds: int = DEFAULT_TOLERANCE_SECONDS):
        self.api_key = api_key
        self.webhook_secret = webhook_secret
        self.price_id_pro = price_id_pro
        self.tolerance_seconds = tolerance_seconds

    @staticmethod
    def compute_signature(*, secret: str, timestamp: str, raw_body: bytes) -> str:
        signed_payload = f"{timestamp}.".encode() + raw_body
        return hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()

    def verify_and_parse_webhook(self, raw_body: bytes, signature_header: str) -> VerifiedEvent:
        if not signature_header:
            raise SignatureVerificationError("Missing Stripe-Signature header")

        parts = dict(
            item.split("=", 1) for item in signature_header.split(",") if "=" in item
        )
        timestamp = parts.get("t")
        v1_signature = parts.get("v1")
        if not timestamp or not v1_signature:
            raise SignatureVerificationError("Malformed Stripe-Signature header")

        if abs(time.time() - int(timestamp)) > self.tolerance_seconds:
            raise SignatureVerificationError("Webhook timestamp outside tolerance (possible replay)")

        expected = self.compute_signature(
            secret=self.webhook_secret, timestamp=timestamp, raw_body=raw_body
        )
        if not hmac.compare_digest(expected, v1_signature):
            raise SignatureVerificationError("Signature mismatch")

        payload = json.loads(raw_body)
        return VerifiedEvent(
            provider=self.provider_name,
            event_id=payload["id"],
            event_type=payload["type"],
            payload=payload,
        )

    def create_checkout_session(self, *, tenant_id: str, plan_id: str) -> dict:
        """In production this calls stripe.checkout.Session.create(...) via the
        official SDK. We isolate that call here so the rest of the app never
        imports `stripe` directly — only this adapter does."""
        import stripe  # imported lazily so the module loads even without the SDK installed

        stripe.api_key = self.api_key
        session = stripe.checkout.Session.create(
            mode="subscription",
            payment_method_types=["card"],
            line_items=[{"price": self.price_id_pro, "quantity": 1}],
            client_reference_id=tenant_id,
            success_url="http://localhost:8000/billing/success",
            cancel_url="http://localhost:8000/billing/cancel",
        )
        return {"checkout_url": session.url, "session_id": session.id}
