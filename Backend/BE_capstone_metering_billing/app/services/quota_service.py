"""
QuotaService — decides ALLOW / 429 / 402 for a requested usage quantity.

Boundary rule (pinned, documented, tested — see README "Known limitations"):
  A request is allowed if and only if (current_usage + requested_qty) <= limit.
  So if limit = 1000 and current_usage = 999, a request for qty=1 lands you
  AT exactly 1000 and is ALLOWED (this is the 1000th call). A request for
  qty=1 when current_usage is already 1000 is REJECTED — you are asking for
  call #1001, and 1001 > 1000. In other words: the boundary value itself is
  always reachable; only requests that would exceed it are rejected.

402 vs 429 — the honest distinction this brief cares about:
  429 Too Many Requests — the tenant's plan is valid and paid for, they've
    simply used up this month's allowance. Retryable next billing cycle.
  402 Payment Required — the tenant's subscription is not in good standing
    (past_due / canceled) OR they are on the Free plan and are attempting an
    action that Free simply does not offer at any volume (reserved for future
    Pro-only endpoints; the metering endpoint itself doesn't have Pro-only
    actions in this capstone's scope, so today 402 fires only on subscription
    status, never on quota volume alone).
"""

from dataclasses import dataclass
from enum import Enum


class QuotaDecision(str, Enum):
    ALLOWED = "allowed"
    QUOTA_EXCEEDED = "quota_exceeded"       # -> HTTP 429
    PAYMENT_REQUIRED = "payment_required"    # -> HTTP 402


@dataclass(frozen=True)
class QuotaCheckResult:
    decision: QuotaDecision
    limit: int
    current_usage: int
    requested_qty: int

    @property
    def remaining(self) -> int:
        return max(0, self.limit - self.current_usage)

    def to_error_body(self) -> dict:
        """JSON error body shape for non-ALLOWED decisions."""
        assert self.decision != QuotaDecision.ALLOWED
        if self.decision == QuotaDecision.PAYMENT_REQUIRED:
            return {
                "error": "payment_required",
                "message": (
                    "This tenant's subscription is not active. "
                    "Upgrade or resolve payment to continue."
                ),
            }
        return {
            "error": "quota_exceeded",
            "message": (
                f"Monthly usage limit exceeded: {self.current_usage}/{self.limit} used, "
                f"requested {self.requested_qty} more. Limit resets next billing cycle "
                f"or upgrade your plan for higher limits."
            ),
            "limit": self.limit,
            "current_usage": self.current_usage,
            "requested_qty": self.requested_qty,
            "remaining": self.remaining,
        }


class QuotaService:
    @staticmethod
    def check(
        *,
        current_usage: int,
        requested_qty: int,
        limit: int,
        subscription_status: str,
    ) -> QuotaCheckResult:
        if subscription_status in ("past_due", "canceled", "incomplete"):
            return QuotaCheckResult(
                decision=QuotaDecision.PAYMENT_REQUIRED,
                limit=limit,
                current_usage=current_usage,
                requested_qty=requested_qty,
            )

        if current_usage + requested_qty > limit:
            return QuotaCheckResult(
                decision=QuotaDecision.QUOTA_EXCEEDED,
                limit=limit,
                current_usage=current_usage,
                requested_qty=requested_qty,
            )

        return QuotaCheckResult(
            decision=QuotaDecision.ALLOWED,
            limit=limit,
            current_usage=current_usage,
            requested_qty=requested_qty,
        )
