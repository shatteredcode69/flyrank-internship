import json
import time

import pytest

from app.services.adapters.base import SignatureVerificationError
from app.services.adapters.local_mock_adapter import LocalMockAdapter
from app.services.adapters.stripe_adapter import StripeAdapter
from app.services.payment_service import PaymentService

pytestmark = pytest.mark.asyncio

STRIPE_SECRET = "whsec_test_secret"
LOCAL_SECRET = "test_local_secret"


def _make_stripe_event(secret=STRIPE_SECRET, event_id="evt_1", event_type="checkout.session.completed",
                        tenant_id="tenant-1", bad_secret=False):
    payload = {
        "id": event_id,
        "type": event_type,
        "data": {"object": {"client_reference_id": tenant_id, "customer": "cus_123", "subscription": "sub_123"}},
    }
    raw_body = json.dumps(payload).encode()
    timestamp = str(int(time.time()))
    sign_secret = "wrong_secret" if bad_secret else secret
    signature = StripeAdapter.compute_signature(secret=sign_secret, timestamp=timestamp, raw_body=raw_body)
    header = f"t={timestamp},v1={signature}"
    return raw_body, header


class TestStripeSignatureVerification:
    def test_valid_signature_verifies(self):
        adapter = StripeAdapter(api_key="sk_test", webhook_secret=STRIPE_SECRET, price_id_pro="price_1")
        raw_body, header = _make_stripe_event()
        event = adapter.verify_and_parse_webhook(raw_body, header)
        assert event.event_id == "evt_1"
        assert event.event_type == "checkout.session.completed"

    def test_forged_signature_raises(self):
        adapter = StripeAdapter(api_key="sk_test", webhook_secret=STRIPE_SECRET, price_id_pro="price_1")
        raw_body, header = _make_stripe_event(bad_secret=True)
        with pytest.raises(SignatureVerificationError):
            adapter.verify_and_parse_webhook(raw_body, header)

    def test_missing_header_raises(self):
        adapter = StripeAdapter(api_key="sk_test", webhook_secret=STRIPE_SECRET, price_id_pro="price_1")
        raw_body, _ = _make_stripe_event()
        with pytest.raises(SignatureVerificationError):
            adapter.verify_and_parse_webhook(raw_body, "")

    def test_stale_timestamp_raises(self):
        adapter = StripeAdapter(api_key="sk_test", webhook_secret=STRIPE_SECRET, price_id_pro="price_1",
                                 tolerance_seconds=300)
        payload = {"id": "evt_old", "type": "checkout.session.completed", "data": {"object": {}}}
        raw_body = json.dumps(payload).encode()
        old_timestamp = str(int(time.time()) - 10_000)
        signature = StripeAdapter.compute_signature(secret=STRIPE_SECRET, timestamp=old_timestamp, raw_body=raw_body)
        header = f"t={old_timestamp},v1={signature}"
        with pytest.raises(SignatureVerificationError):
            adapter.verify_and_parse_webhook(raw_body, header)


class TestLocalMockSignatureVerification:
    def test_valid_signature_verifies(self):
        adapter = LocalMockAdapter(webhook_secret=LOCAL_SECRET)
        raw_body, signature = LocalMockAdapter.build_signed_event(
            secret=LOCAL_SECRET, event_type="subscription.activated", tenant_id="tenant-1"
        )
        event = adapter.verify_and_parse_webhook(raw_body, signature)
        assert event.event_type == "subscription.activated"

    def test_forged_signature_raises(self):
        adapter = LocalMockAdapter(webhook_secret=LOCAL_SECRET)
        raw_body, _ = LocalMockAdapter.build_signed_event(
            secret=LOCAL_SECRET, event_type="subscription.activated", tenant_id="tenant-1"
        )
        forged_signature = "sha256=" + "0" * 64
        with pytest.raises(SignatureVerificationError):
            adapter.verify_and_parse_webhook(raw_body, forged_signature)

    def test_signed_with_wrong_secret_raises(self):
        adapter = LocalMockAdapter(webhook_secret=LOCAL_SECRET)
        raw_body, signature = LocalMockAdapter.build_signed_event(
            secret="a_totally_different_secret", event_type="subscription.activated", tenant_id="tenant-1"
        )
        with pytest.raises(SignatureVerificationError):
            adapter.verify_and_parse_webhook(raw_body, signature)


class TestWebhookDeduplication:
    async def test_duplicate_event_id_is_ignored_second_time(self, db_session, tenant):
        adapter = StripeAdapter(api_key="sk_test", webhook_secret=STRIPE_SECRET, price_id_pro="price_1")
        raw_body, header = _make_stripe_event(event_id="evt_dup_1", tenant_id=tenant.id)
        event = adapter.verify_and_parse_webhook(raw_body, header)

        service = PaymentService(db_session)
        result1 = await service.handle_verified_event(event)
        result2 = await service.handle_verified_event(event)

        assert result1.outcome == "processed"
        assert result2.outcome == "duplicate_ignored"

    async def test_checkout_completed_upgrades_tenant_to_pro(self, db_session, tenant):
        assert tenant.plan_id == "free"
        adapter = StripeAdapter(api_key="sk_test", webhook_secret=STRIPE_SECRET, price_id_pro="price_1")
        raw_body, header = _make_stripe_event(event_id="evt_checkout_1", tenant_id=tenant.id)
        event = adapter.verify_and_parse_webhook(raw_body, header)

        await PaymentService(db_session).handle_verified_event(event)
        await db_session.refresh(tenant)
        assert tenant.plan_id == "pro"
        assert tenant.status == "active"

    async def test_local_mock_activation_upgrades_tenant(self, db_session, tenant):
        adapter = LocalMockAdapter(webhook_secret=LOCAL_SECRET)
        raw_body, signature = LocalMockAdapter.build_signed_event(
            secret=LOCAL_SECRET, event_type="subscription.activated", tenant_id=tenant.id
        )
        event = adapter.verify_and_parse_webhook(raw_body, signature)
        await PaymentService(db_session).handle_verified_event(event)
        await db_session.refresh(tenant)
        assert tenant.plan_id == "pro"
