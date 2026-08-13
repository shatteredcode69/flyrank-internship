import pytest

from app.pricing import TOKEN_PRICING, API_CALL_PRICING
from app.services.cost_service import CostService, TokenUsage


def test_standard_input_tokens_priced_at_standard_rate():
    usage = TokenUsage(standard_input_tokens=1000)
    cost = CostService.price_tokens(usage)
    assert cost == 1000 * TOKEN_PRICING.standard_input_micro_cents_per_token
    assert isinstance(cost, int)


def test_cached_input_tokens_are_cheaper_than_standard():
    standard = CostService.price_tokens(TokenUsage(standard_input_tokens=1000))
    cached = CostService.price_tokens(TokenUsage(cached_input_tokens=1000))
    assert cached < standard


def test_reasoning_tokens_billed_at_output_rate_not_separately():
    reasoning_only = CostService.price_tokens(TokenUsage(reasoning_tokens=500))
    output_only = CostService.price_tokens(TokenUsage(output_tokens=500))
    assert reasoning_only == output_only == 500 * TOKEN_PRICING.output_micro_cents_per_token


def test_categories_priced_independently_not_summed_then_priced():
    # If someone "optimized" this into summing raw counts and pricing once
    # at the input rate, this test would fail — that's the point.
    usage = TokenUsage(
        standard_input_tokens=100,
        cached_input_tokens=100,
        output_tokens=100,
        reasoning_tokens=100,
    )
    expected = (
        100 * TOKEN_PRICING.standard_input_micro_cents_per_token
        + 100 * TOKEN_PRICING.cached_input_micro_cents_per_token
        + (100 + 100) * TOKEN_PRICING.output_micro_cents_per_token
    )
    assert CostService.price_tokens(usage) == expected


def test_pricing_is_pinned_exact_values():
    """Locks the exact pinned rates. If this test fails, someone changed
    pricing without updating PRICING_VERSION and this test together."""
    assert TOKEN_PRICING.standard_input_micro_cents_per_token == 3
    assert TOKEN_PRICING.cached_input_micro_cents_per_token == 1
    assert TOKEN_PRICING.output_micro_cents_per_token == 15
    assert API_CALL_PRICING.micro_cents_per_call == 200


def test_api_call_pricing():
    assert CostService.price_api_calls(10) == 10 * API_CALL_PRICING.micro_cents_per_call
    assert CostService.price_api_calls(0) == 0


def test_negative_quantities_rejected():
    with pytest.raises(ValueError):
        CostService.price_api_calls(-1)
    with pytest.raises(ValueError):
        TokenUsage(standard_input_tokens=-5)


def test_total_tokens_billed_counts_every_category_once():
    usage = TokenUsage(standard_input_tokens=10, cached_input_tokens=20, output_tokens=30, reasoning_tokens=40)
    assert CostService.total_tokens_billed(usage) == 100


def test_all_costs_are_ints_never_float():
    usage = TokenUsage(standard_input_tokens=1, cached_input_tokens=1, output_tokens=1, reasoning_tokens=1)
    result = CostService.price_tokens(usage)
    assert isinstance(result, int)
    assert not isinstance(result, float)
