"""
LocalMockAdapter — Provider 2 of the modular payment gateway pattern.

Simulates a local digital-wallet-style processor (the kind used in markets
where a live Stripe merchant account isn't yet set up). It signs/verifies
payloads with HMAC-SHA256 over the raw request body using a shared secret,
and drives the exact same Free -> Pro upgrade path as the Stripe adapter,
through the same PaymentAdapter interface.

Header convention (our own, documented in README):
    X-Local-Signature: sha256=<hex hmac>
"""

import hashlib
import hmac
import json
import time
import uuid

from app.services.adapters.base import PaymentAdapter, SignatureVerificationError, VerifiedEvent


class LocalMockAdapter(PaymentAdapter):
    provider_name = "local_mock"

    def __init__(self, *, webhook_secret: str):
        self.webhook_secret = webhook_secret

    @staticmethod
    def compute_signature(*, secret: str, raw_body: bytes) -> str:
        digest = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
        return f"sha256={digest}"

    def verify_and_parse_webhook(self, raw_body: bytes, signature_header: str) -> VerifiedEvent:
        if not signature_header or not signature_header.startswith("sha256="):
            raise SignatureVerificationError("Missing or malformed X-Local-Signature header")

        expected = self.compute_signature(secret=self.webhook_secret, raw_body=raw_body)
        if not hmac.compare_digest(expected, signature_header):
            raise SignatureVerificationError("Signature mismatch")

        payload = json.loads(raw_body)
        return VerifiedEvent(
            provider=self.provider_name,
            event_id=payload["id"],
            event_type=payload["type"],
            payload=payload,
        )

    def create_checkout_session(self, *, tenant_id: str, plan_id: str) -> dict:
        """No hosted page to redirect to for the mock provider — instead we
        return a fake reference the local `scripts/simulate_local_webhook.py`
        runner (see README "Local Webhook Testing Guide") uses to build and
        sign a matching webhook payload."""
        checkout_reference = f"local_checkout_{uuid.uuid4().hex[:12]}"
        return {"checkout_reference": checkout_reference, "tenant_id": tenant_id, "plan_id": plan_id}

    @staticmethod
    def build_signed_event(*, secret: str, event_type: str, tenant_id: str,
                            subscription_id: str | None = None) -> tuple[bytes, str]:
        """Test/demo helper: builds a realistic event payload and signs it,
        exactly like the external `simulate_local_webhook.py` CLI runner does.
        Returns (raw_body_bytes, signature_header)."""
        payload = {
            "id": f"evt_local_{uuid.uuid4().hex[:16]}",
            "type": event_type,  # 'subscription.activated' | 'subscription.canceled'
            "created": int(time.time()),
            "data": {
                "tenant_id": tenant_id,
                "subscription_id": subscription_id or f"sub_local_{uuid.uuid4().hex[:12]}",
                "plan_id": "pro",
            },
        }
        raw_body = json.dumps(payload).encode()
        signature = LocalMockAdapter.compute_signature(secret=secret, raw_body=raw_body)
        return raw_body, signature
