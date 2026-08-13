import pytest
from sqlalchemy import func, select

from app.models import UsageEvent
from app.services.cost_service import TokenUsage
from app.services.metering_service import MeteringService

pytestmark = pytest.mark.asyncio


async def test_same_idempotency_key_creates_exactly_one_row(db_session, tenant):
    service = MeteringService(db_session)

    result1 = await service.record(
        tenant=tenant, idempotency_key="key-abc", usage_type="api_call", api_call_qty=1
    )
    result2 = await service.record(
        tenant=tenant, idempotency_key="key-abc", usage_type="api_call", api_call_qty=1
    )

    assert result1.outcome == "created"
    assert result2.outcome == "duplicate"

    count = await db_session.execute(
        select(func.count()).select_from(UsageEvent).where(UsageEvent.idempotency_key == "key-abc")
    )
    assert count.scalar_one() == 1


async def test_retried_request_returns_identical_snapshot(db_session, tenant):
    service = MeteringService(db_session)

    result1 = await service.record(
        tenant=tenant, idempotency_key="key-xyz", usage_type="ai_tokens",
        token_usage=TokenUsage(standard_input_tokens=100, output_tokens=50),
    )
    result2 = await service.record(
        tenant=tenant, idempotency_key="key-xyz", usage_type="ai_tokens",
        token_usage=TokenUsage(standard_input_tokens=100, output_tokens=50),
    )

    assert result1.usage_event.response_snapshot == result2.usage_event.response_snapshot
    assert result1.usage_event.id == result2.usage_event.id


async def test_retried_request_does_not_double_count_toward_quota(db_session, tenant):
    service = MeteringService(db_session)

    await service.record(tenant=tenant, idempotency_key="key-1", usage_type="api_call", api_call_qty=500)
    await service.record(tenant=tenant, idempotency_key="key-1", usage_type="api_call", api_call_qty=500)
    await service.record(tenant=tenant, idempotency_key="key-1", usage_type="api_call", api_call_qty=500)

    api_used, _ = await service._current_month_usage(tenant.id)
    assert api_used == 500  # not 1500 — three retries of the same key, one event


async def test_different_idempotency_keys_create_separate_events(db_session, tenant):
    service = MeteringService(db_session)

    await service.record(tenant=tenant, idempotency_key="key-a", usage_type="api_call", api_call_qty=1)
    await service.record(tenant=tenant, idempotency_key="key-b", usage_type="api_call", api_call_qty=1)

    count = await db_session.execute(select(func.count()).select_from(UsageEvent))
    assert count.scalar_one() == 2


async def test_idempotency_key_is_scoped_per_tenant(db_session, tenant):
    """The same idempotency key from two different tenants must not collide —
    the unique constraint is on (tenant_id, idempotency_key), not key alone."""
    from app.models import Tenant
    import uuid

    other_tenant = Tenant(id=str(uuid.uuid4()), name="Other Tenant", plan_id="free", status="active")
    db_session.add(other_tenant)
    await db_session.commit()
    await db_session.refresh(other_tenant)

    service = MeteringService(db_session)
    r1 = await service.record(tenant=tenant, idempotency_key="shared-key", usage_type="api_call", api_call_qty=1)
    r2 = await service.record(tenant=other_tenant, idempotency_key="shared-key", usage_type="api_call", api_call_qty=1)

    assert r1.outcome == "created"
    assert r2.outcome == "created"  # different tenant, same key -> NOT a duplicate
