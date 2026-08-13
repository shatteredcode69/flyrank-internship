"""
CostService — converts token/call quantities into an integer micro-cent cost.

This is the module the brief calls out by name: "the cost math is easy —
encoding it correctly, with pinned tests, is the discipline." Every rule
below has a corresponding test in tests/test_cost_engine.py.
"""

from dataclasses import dataclass

from app.pricing import API_CALL_PRICING, TOKEN_PRICING


@dataclass(frozen=True)
class TokenUsage:
    standard_input_tokens: int = 0
    cached_input_tokens: int = 0
    output_tokens: int = 0
    reasoning_tokens: int = 0  # billed as output, never priced separately

    def __post_init__(self):
        for field_name in (
            "standard_input_tokens",
            "cached_input_tokens",
            "output_tokens",
            "reasoning_tokens",
        ):
            value = getattr(self, field_name)
            if not isinstance(value, int) or isinstance(value, bool):
                raise TypeError(f"{field_name} must be an int, got {type(value)}")
            if value < 0:
                raise ValueError(f"{field_name} cannot be negative, got {value}")


class CostService:
    """Stateless — safe to use as a module-level singleton or per-request."""

    @staticmethod
    def price_tokens(usage: TokenUsage) -> int:
        """
        Returns total cost in integer micro-cents.

        Each category is priced independently at its own per-token rate and
        the results are summed — categories are NEVER added together as raw
        token counts before pricing (that would silently apply the wrong
        rate to cached/reasoning tokens).

        Reasoning tokens are folded into the *output* rate bucket, per the
        pinned rule "reasoning tokens are billed as output tokens".
        """
        standard_input_cost = (
            usage.standard_input_tokens * TOKEN_PRICING.standard_input_micro_cents_per_token
        )
        cached_input_cost = (
            usage.cached_input_tokens * TOKEN_PRICING.cached_input_micro_cents_per_token
        )
        # reasoning + output share one rate bucket, by design
        output_bucket_tokens = usage.output_tokens + usage.reasoning_tokens
        output_cost = output_bucket_tokens * TOKEN_PRICING.output_micro_cents_per_token

        total = standard_input_cost + cached_input_cost + output_cost
        return total  # int, always

    @staticmethod
    def price_api_calls(call_count: int) -> int:
        if not isinstance(call_count, int) or isinstance(call_count, bool) or call_count < 0:
            raise ValueError(f"call_count must be a non-negative int, got {call_count}")
        return call_count * API_CALL_PRICING.micro_cents_per_call

    @staticmethod
    def total_tokens_billed(usage: TokenUsage) -> int:
        """Total token count against the plan's *token quota* (cached tokens
        still count toward quota even though they're cheaper — quota is a
        volume limit, not a spend limit)."""
        return (
            usage.standard_input_tokens
            + usage.cached_input_tokens
            + usage.output_tokens
            + usage.reasoning_tokens
        )

    @staticmethod
    def micro_cents_to_display(micro_cents: int) -> str:
        """Formats micro-cents as a human dollar string, e.g. '$1.2345'.
        Display-only — never parse this back into a stored value."""
        dollars = micro_cents / 1_000_000  # division only for display formatting
        return f"${dollars:.4f}"
