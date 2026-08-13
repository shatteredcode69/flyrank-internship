from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Tenant, UsageEvent
from app.pricing import PLAN_QUOTAS
from app.schemas import RecordUsageRequest, UsageRollupResponse
from app.services.cost_service import CostService, TokenUsage
from app.services.metering_service import MeteringService
from app.time_utils import current_month_bounds

router = APIRouter(prefix="/api/v1/usage", tags=["usage"])


@router.post("/record", status_code=201)
async def record_usage(
    body: RecordUsageRequest,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
):
    if not idempotency_key.strip():
        raise HTTPException(status_code=400, detail="Idempotency-Key header is required and cannot be blank")

    tenant = await db.get(Tenant, body.tenant_id)
    if tenant is None:
        raise HTTPException(status_code=404, detail=f"Unknown tenant_id: {body.tenant_id}")

    token_usage = TokenUsage(
        standard_input_tokens=body.tokens.standard_input_tokens,
        cached_input_tokens=body.tokens.cached_input_tokens,
        output_tokens=body.tokens.output_tokens,
        reasoning_tokens=body.tokens.reasoning_tokens,
    )

    service = MeteringService(db)
    result = await service.record(
        tenant=tenant,
        idempotency_key=idempotency_key,
        usage_type=body.usage_type,
        api_call_qty=body.api_call_qty,
        token_usage=token_usage,
    )

    if result.outcome in ("quota_exceeded", "payment_required"):
        raise HTTPException(status_code=result.http_status, detail=result.quota_error_body)

    # 'created' and 'duplicate' both return the same snapshot shape — a
    # retried request is indistinguishable in body from the original,
    # which is the whole point of idempotency.
    return {
        "status": "duplicate" if result.outcome == "duplicate" else "recorded",
        "usage_event_id": result.usage_event.id,
        **result.usage_event.response_snapshot,
    }


@router.get("/rollup", response_model=UsageRollupResponse)
async def usage_rollup(tenant_id: str, db: AsyncSession = Depends(get_db)):
    tenant = await db.get(Tenant, tenant_id)
    if tenant is None:
        raise HTTPException(status_code=404, detail=f"Unknown tenant_id: {tenant_id}")

    start, end = current_month_bounds()
    result = await db.execute(
        select(
            func.coalesce(func.sum(UsageEvent.api_call_qty), 0),
            func.coalesce(
                func.sum(
                    UsageEvent.input_tokens
                    + UsageEvent.cached_input_tokens
                    + UsageEvent.output_tokens
                    + UsageEvent.reasoning_tokens
                ),
                0,
            ),
            func.coalesce(func.sum(UsageEvent.cost_micro_cents), 0),
        ).where(
            UsageEvent.tenant_id == tenant_id,
            UsageEvent.created_at >= start,
            UsageEvent.created_at < end,
        )
    )
    api_calls_used, tokens_used, cost_micro_cents = result.one()
    quota = PLAN_QUOTAS[tenant.plan_id]

    return UsageRollupResponse(
        tenant_id=tenant.id,
        plan_id=tenant.plan_id,
        api_calls_used=int(api_calls_used),
        api_calls_limit=quota["api_calls"],
        tokens_used=int(tokens_used),
        tokens_limit=quota["tokens"],
        cost_micro_cents=int(cost_micro_cents),
        cost_display=CostService.micro_cents_to_display(int(cost_micro_cents)),
    )
