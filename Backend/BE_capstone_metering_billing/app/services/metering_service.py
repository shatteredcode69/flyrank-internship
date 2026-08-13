"""
MeteringService — the heart of the capstone.

Exactly-once guarantee, explained:
  The database has a UNIQUE constraint on (tenant_id, idempotency_key)
  (see migrations/schema.sql). We do NOT implement idempotency by
  "SELECT first, then INSERT if not found" — that has a race window
  between two concurrent retries. Instead we always attempt the INSERT
  and let the database's unique constraint be the single source of
  truth: if it fails with a uniqueness violation, we know another
  request (or an earlier attempt of this exact request) already won,
  so we SELECT the winning row and return ITS snapshot verbatim. This
  makes the guarantee correct even under concurrent retries, not just
  sequential ones.
"""

from dataclasses import dataclass
from typing import Literal

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Tenant, UsageEvent
from app.pricing import PLAN_QUOTAS
from app.services.cost_service import CostService, TokenUsage
from app.services.quota_service import QuotaDecision, QuotaService


@dataclass
class MeteringResult:
    outcome: Literal["created", "duplicate", "quota_exceeded", "payment_required"]
    usage_event: UsageEvent | None
    quota_error_body: dict | None = None

    @property
    def http_status(self) -> int:
        return {
            "created": 201,
            "duplicate": 200,  # retry mirrors the original success response
            "quota_exceeded": 429,
            "payment_required": 402,
        }[self.outcome]


class MeteringService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _current_month_usage(self, tenant_id: str) -> tuple[int, int]:
        """Returns (api_calls_used, tokens_used) for the current calendar month.

        Month boundaries are computed in Python (not via func.date_trunc)
        so the exact same query works against both Postgres (production)
        and SQLite (test suite) — see app/time_utils.py."""
        from sqlalchemy import func

        from app.time_utils import current_month_bounds

        start, end = current_month_bounds()
        result = await self.db.execute(
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
            ).where(
                UsageEvent.tenant_id == tenant_id,
                UsageEvent.created_at >= start,
                UsageEvent.created_at < end,
            )
        )
        api_calls, tokens = result.one()
        return int(api_calls), int(tokens)

    async def record(
        self,
        *,
        tenant: Tenant,
        idempotency_key: str,
        usage_type: str,  # 'api_call' | 'ai_tokens'
        api_call_qty: int = 0,
        token_usage: TokenUsage | None = None,
    ) -> MeteringResult:
        token_usage = token_usage or TokenUsage()

        # 1. Compute what this request would cost / consume against quota
        #    BEFORE touching the ledger, so a rejected request never gets
        #    a half-written row.
        requested_tokens = CostService.total_tokens_billed(token_usage)
        api_used, tokens_used = await self._current_month_usage(tenant.id)
        quota = PLAN_QUOTAS[tenant.plan_id]

        api_check = QuotaService.check(
            current_usage=api_used,
            requested_qty=api_call_qty,
            limit=quota["api_calls"],
            subscription_status=tenant.status,
        )
        token_check = QuotaService.check(
            current_usage=tokens_used,
            requested_qty=requested_tokens,
            limit=quota["tokens"],
            subscription_status=tenant.status,
        )

        for check in (api_check, token_check):
            if check.decision == QuotaDecision.PAYMENT_REQUIRED:
                return MeteringResult(
                    outcome="payment_required", usage_event=None,
                    quota_error_body=check.to_error_body(),
                )
            if check.decision == QuotaDecision.QUOTA_EXCEEDED:
                return MeteringResult(
                    outcome="quota_exceeded", usage_event=None,
                    quota_error_body=check.to_error_body(),
                )

        # 2. Price the request (integer micro-cents, never float)
        cost = CostService.price_api_calls(api_call_qty) + CostService.price_tokens(token_usage)

        snapshot = {
            "tenant_id": tenant.id,
            "usage_type": usage_type,
            "api_call_qty": api_call_qty,
            "input_tokens": token_usage.standard_input_tokens,
            "cached_input_tokens": token_usage.cached_input_tokens,
            "output_tokens": token_usage.output_tokens,
            "reasoning_tokens": token_usage.reasoning_tokens,
            "cost_micro_cents": cost,
        }

        event = UsageEvent(
            tenant_id=tenant.id,
            idempotency_key=idempotency_key,
            usage_type=usage_type,
            api_call_qty=api_call_qty,
            input_tokens=token_usage.standard_input_tokens,
            cached_input_tokens=token_usage.cached_input_tokens,
            output_tokens=token_usage.output_tokens,
            reasoning_tokens=token_usage.reasoning_tokens,
            cost_micro_cents=cost,
            response_snapshot=snapshot,
        )

        # 3. Attempt the insert. The UNIQUE(tenant_id, idempotency_key)
        #    constraint is the actual idempotency guarantee — this is not
        #    a check-then-act race.
        self.db.add(event)
        try:
            await self.db.commit()
            await self.db.refresh(event)
            return MeteringResult(outcome="created", usage_event=event)
        except IntegrityError:
            await self.db.rollback()
            existing = await self.db.execute(
                select(UsageEvent).where(
                    UsageEvent.tenant_id == tenant.id,
                    UsageEvent.idempotency_key == idempotency_key,
                )
            )
            winning_row = existing.scalar_one()
            return MeteringResult(outcome="duplicate", usage_event=winning_row)
