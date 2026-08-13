import pytest

pytestmark = pytest.mark.asyncio


async def test_record_usage_requires_idempotency_key_header(app_client, tenant):
    resp = await app_client.post(
        "/api/v1/usage/record",
        json={"tenant_id": tenant.id, "usage_type": "api_call", "api_call_qty": 1},
    )
    assert resp.status_code == 422  # FastAPI header validation


async def test_record_usage_retry_returns_200_with_same_body(app_client, tenant):
    headers = {"Idempotency-Key": "http-key-1"}
    body = {"tenant_id": tenant.id, "usage_type": "api_call", "api_call_qty": 1}

    first = await app_client.post("/api/v1/usage/record", json=body, headers=headers)
    second = await app_client.post("/api/v1/usage/record", json=body, headers=headers)

    assert first.status_code == 201
    assert second.status_code == 200
    assert first.json()["usage_event_id"] == second.json()["usage_event_id"]


async def test_unknown_tenant_returns_404(app_client):
    resp = await app_client.post(
        "/api/v1/usage/record",
        json={"tenant_id": "does-not-exist", "usage_type": "api_call", "api_call_qty": 1},
        headers={"Idempotency-Key": "k1"},
    )
    assert resp.status_code == 404


async def test_quota_boundary_returns_429_after_limit(app_client, tenant):
    headers_base = {"Idempotency-Key": "prefix"}
    body = {"tenant_id": tenant.id, "usage_type": "api_call", "api_call_qty": 1000}
    # consume the full 1000/1000 free-plan quota in one shot
    resp = await app_client.post(
        "/api/v1/usage/record", json=body, headers={"Idempotency-Key": "fill-quota"}
    )
    assert resp.status_code == 201

    # one more call, any amount, must now be rejected
    over_resp = await app_client.post(
        "/api/v1/usage/record",
        json={"tenant_id": tenant.id, "usage_type": "api_call", "api_call_qty": 1},
        headers={"Idempotency-Key": "one-too-many"},
    )
    assert over_resp.status_code == 429
    assert over_resp.json()["detail"]["error"] == "quota_exceeded"


async def test_rollup_reflects_recorded_usage(app_client, tenant):
    await app_client.post(
        "/api/v1/usage/record",
        json={"tenant_id": tenant.id, "usage_type": "api_call", "api_call_qty": 3},
        headers={"Idempotency-Key": "rollup-key"},
    )
    resp = await app_client.get(f"/api/v1/usage/rollup?tenant_id={tenant.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["api_calls_used"] == 3
    assert data["api_calls_limit"] == 1000
