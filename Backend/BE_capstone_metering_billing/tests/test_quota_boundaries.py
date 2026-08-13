from app.services.quota_service import QuotaDecision, QuotaService


def test_999_of_1000_allows_the_1000th_call():
    result = QuotaService.check(current_usage=999, requested_qty=1, limit=1000, subscription_status="active")
    assert result.decision == QuotaDecision.ALLOWED


def test_exactly_at_1000_rejects_the_1001st_call():
    result = QuotaService.check(current_usage=1000, requested_qty=1, limit=1000, subscription_status="active")
    assert result.decision == QuotaDecision.QUOTA_EXCEEDED


def test_under_limit_allows():
    result = QuotaService.check(current_usage=500, requested_qty=1, limit=1000, subscription_status="active")
    assert result.decision == QuotaDecision.ALLOWED


def test_request_that_would_land_exactly_on_limit_is_allowed():
    # current=990, requesting 10 -> lands at exactly 1000 -> allowed
    result = QuotaService.check(current_usage=990, requested_qty=10, limit=1000, subscription_status="active")
    assert result.decision == QuotaDecision.ALLOWED


def test_request_that_would_exceed_limit_by_one_is_rejected():
    # current=990, requesting 11 -> would land at 1001 -> rejected
    result = QuotaService.check(current_usage=990, requested_qty=11, limit=1000, subscription_status="active")
    assert result.decision == QuotaDecision.QUOTA_EXCEEDED


def test_past_due_subscription_returns_payment_required_not_quota_exceeded():
    # Even with plenty of quota remaining, a bad subscription status is 402, not 429.
    result = QuotaService.check(current_usage=1, requested_qty=1, limit=1000, subscription_status="past_due")
    assert result.decision == QuotaDecision.PAYMENT_REQUIRED


def test_canceled_subscription_returns_payment_required():
    result = QuotaService.check(current_usage=0, requested_qty=1, limit=1000, subscription_status="canceled")
    assert result.decision == QuotaDecision.PAYMENT_REQUIRED


def test_error_body_shape_for_quota_exceeded():
    result = QuotaService.check(current_usage=1000, requested_qty=1, limit=1000, subscription_status="active")
    body = result.to_error_body()
    assert body["error"] == "quota_exceeded"
    assert body["limit"] == 1000
    assert body["current_usage"] == 1000
    assert "message" in body


def test_error_body_shape_for_payment_required():
    result = QuotaService.check(current_usage=0, requested_qty=1, limit=1000, subscription_status="canceled")
    body = result.to_error_body()
    assert body["error"] == "payment_required"


def test_remaining_never_negative():
    result = QuotaService.check(current_usage=1200, requested_qty=1, limit=1000, subscription_status="active")
    assert result.remaining == 0
