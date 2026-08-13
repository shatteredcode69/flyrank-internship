"""
PaymentService — the provider-agnostic half of webhook handling.

Given an already-verified event (signature checked by the adapter), this
service:
  1. Deduplicates via the webhook_events(provider, provider_event_id)
     unique constraint — same pattern as MeteringService: attempt the
     insert, treat a uniqueness violation as "already processed, no-op".
  2. Maps the event type to a tenant/subscription state change.
  3. Applies that change to the tenants/subscriptions tables.

Route handlers never touch tenant rows directly for webhook-driven
changes — everything goes through here so the sync logic has one home.
"""

from dataclasses import dataclass
from typing import Literal

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Subscription, Tenant, WebhookEvent
from app.services.adapters.base import VerifiedEvent

# Event types this service understands, across both providers.
STRIPE_CHECKOUT_COMPLETED = "checkout.session.completed"
STRIPE_SUBSCRIPTION_UPDATED = "customer.subscription.updated"
STRIPE_SUBSCRIPTION_DELETED = "customer.subscription.deleted"
LOCAL_SUBSCRIPTION_ACTIVATED = "subscription.activated"
LOCAL_SUBSCRIPTION_CANCELED = "subscription.canceled"


@dataclass
class WebhookProcessResult:
    outcome: Literal["processed", "duplicate_ignored", "unhandled_event_type"]
    event_id: str


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def handle_verified_event(self, event: VerifiedEvent) -> WebhookProcessResult:
        webhook_row = WebhookEvent(
            provider=event.provider,
            provider_event_id=event.event_id,
            event_type=event.event_type,
            payload=event.payload,
        )
        self.db.add(webhook_row)
        try:
            await self.db.flush()  # triggers the unique constraint check
        except IntegrityError:
            await self.db.rollback()
            return WebhookProcessResult(outcome="duplicate_ignored", event_id=event.event_id)

        # New event — apply the corresponding state change.
        if event.provider == "stripe":
            await self._apply_stripe_event(event)
        elif event.provider == "local_mock":
            await self._apply_local_mock_event(event)
        else:
            await self.db.commit()
            return WebhookProcessResult(outcome="unhandled_event_type", event_id=event.event_id)

        await self.db.commit()
        return WebhookProcessResult(outcome="processed", event_id=event.event_id)

    async def _get_tenant_by_stripe_customer(self, customer_id: str) -> Tenant | None:
        result = await self.db.execute(select(Tenant).where(Tenant.stripe_customer_id == customer_id))
        return result.scalar_one_or_none()

    async def _apply_stripe_event(self, event: VerifiedEvent) -> None:
        data = event.payload.get("data", {}).get("object", {})

        if event.event_type == STRIPE_CHECKOUT_COMPLETED:
            tenant_id = data.get("client_reference_id")
            customer_id = data.get("customer")
            subscription_id = data.get("subscription")
            tenant = await self.db.get(Tenant, tenant_id) if tenant_id else None
            if tenant is None:
                return
            tenant.stripe_customer_id = customer_id
            tenant.plan_id = "pro"
            tenant.status = "active"
            self.db.add(
                Subscription(
                    tenant_id=tenant.id,
                    provider="stripe",
                    provider_subscription_id=subscription_id or f"unknown_{event.event_id}",
                    plan_id="pro",
                    status="active",
                )
            )

        elif event.event_type == STRIPE_SUBSCRIPTION_UPDATED:
            customer_id = data.get("customer")
            tenant = await self._get_tenant_by_stripe_customer(customer_id)
            if tenant is None:
                return
            status = data.get("status", "active")
            tenant.status = status
            tenant.plan_id = "pro" if status == "active" else tenant.plan_id

        elif event.event_type == STRIPE_SUBSCRIPTION_DELETED:
            customer_id = data.get("customer")
            tenant = await self._get_tenant_by_stripe_customer(customer_id)
            if tenant is None:
                return
            tenant.plan_id = "free"
            tenant.status = "canceled"

    async def _apply_local_mock_event(self, event: VerifiedEvent) -> None:
        data = event.payload.get("data", {})
        tenant_id = data.get("tenant_id")
        tenant = await self.db.get(Tenant, tenant_id) if tenant_id else None
        if tenant is None:
            return

        if event.event_type == LOCAL_SUBSCRIPTION_ACTIVATED:
            tenant.plan_id = "pro"
            tenant.status = "active"
            self.db.add(
                Subscription(
                    tenant_id=tenant.id,
                    provider="local_mock",
                    provider_subscription_id=data.get("subscription_id", f"unknown_{event.event_id}"),
                    plan_id="pro",
                    status="active",
                )
            )
        elif event.event_type == LOCAL_SUBSCRIPTION_CANCELED:
            tenant.plan_id = "free"
            tenant.status = "canceled"
