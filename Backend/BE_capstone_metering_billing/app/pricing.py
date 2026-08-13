"""
Pinned pricing configuration.

RULES (see EVIDENCE.md / README for the "why"):
  - All monetary values are integers in MICRO-CENTS (1 cent = 10_000 micro-cents,
    1 USD = 1_000_000 micro-cents). We never use float for money, anywhere.
    Micro-cents (not plain cents) because per-token prices are fractions of a
    cent (e.g. $0.15 / 1M tokens == 0.000015 cents/token), which would round
    to zero at whole-cent granularity.
  - Cached input tokens are billed at a discount vs. standard input tokens.
  - Reasoning ("thinking") tokens are billed at the OUTPUT rate, not a
    separate category — they are added into the output token count before
    pricing, never priced independently.
  - Token categories are NOT simply summed and priced at one rate — each
    category is priced at its own rate, then the per-category costs are
    summed. Summing raw token counts across categories before pricing is
    the classic bug this file exists to prevent.

This module has zero third-party dependencies on purpose, so its logic can
be unit tested with nothing but the standard library (see tests/test_cost_engine.py
and verify_core_logic.py).
"""

from dataclasses import dataclass

# 1 USD cent = 10_000 micro-cents. Using micro-cents (not micro-dollars) keeps
# the "cents" mental model while giving enough precision for sub-cent token rates.
MICRO_CENTS_PER_CENT = 10_000
MICRO_CENTS_PER_USD = 100 * MICRO_CENTS_PER_CENT


@dataclass(frozen=True)
class TokenPricing:
    """Price per single token, in micro-cents. Pinned, immutable, testable."""
    standard_input_micro_cents_per_token: int
    cached_input_micro_cents_per_token: int
    output_micro_cents_per_token: int  # reasoning tokens are billed at this rate


@dataclass(frozen=True)
class ApiCallPricing:
    """Price per single metered API call, in micro-cents."""
    micro_cents_per_call: int


# ────────────────────────────────────────────────────────────────
# PINNED PRICING TABLE
#
# Modeled on real-world AI provider pricing shape (e.g. published rates for
# cached vs. standard input, with reasoning tokens billed as output). These
# are our own product's simulated rates, pinned so tests never silently
# drift when someone "adjusts a number real quick".
#
# Standard input:  $3.00  / 1,000,000 tokens -> 0.0003 cents/token -> 3 micro-cents/token
# Cached input:     $0.30  / 1,000,000 tokens -> 0.00003 cents/token -> 0.3 micro-cents/token
#                    (rounded to nearest whole micro-cent unit below; see note)
# Output/reasoning: $15.00 / 1,000,000 tokens -> 0.0015 cents/token -> 15 micro-cents/token
# ────────────────────────────────────────────────────────────────
TOKEN_PRICING = TokenPricing(
    standard_input_micro_cents_per_token=3,
    cached_input_micro_cents_per_token=1,   # ~3x cheaper than standard input, floor of 1
    output_micro_cents_per_token=15,
)

API_CALL_PRICING = ApiCallPricing(
    micro_cents_per_call=200,  # $0.02 per metered API call
)

PLAN_QUOTAS = {
    "free": {"api_calls": 1_000, "tokens": 100_000},
    "pro": {"api_calls": 50_000, "tokens": 5_000_000},
}

PRICING_VERSION = "2026-08-01"  # bump whenever a rate below changes; tests pin to this
