from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.services.adapters.base import SignatureVerificationError
from app.services.adapters.local_mock_adapter import LocalMockAdapter
from app.services.adapters.stripe_adapter import StripeAdapter
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/api/v1/webhooks", tags=["webhooks"])
settings = get_settings()


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
    db: AsyncSession = Depends(get_db),
):
    raw_body = await request.body()
    adapter = StripeAdapter(
        api_key=settings.stripe_secret_key,
        webhook_secret=settings.stripe_webhook_secret,
        price_id_pro=settings.stripe_price_id_pro,
    )
    try:
        verified = adapter.verify_and_parse_webhook(raw_body, stripe_signature)
    except SignatureVerificationError as exc:
        raise HTTPException(status_code=400, detail=f"Webhook signature verification failed: {exc}")

    result = await PaymentService(db).handle_verified_event(verified)
    return {"status": result.outcome, "event_id": result.event_id}


@router.post("/local")
async def local_mock_webhook(
    request: Request,
    x_local_signature: str = Header(None, alias="X-Local-Signature"),
    db: AsyncSession = Depends(get_db),
):
    raw_body = await request.body()
    adapter = LocalMockAdapter(webhook_secret=settings.local_mock_webhook_secret)
    try:
        verified = adapter.verify_and_parse_webhook(raw_body, x_local_signature)
    except SignatureVerificationError as exc:
        raise HTTPException(status_code=400, detail=f"Webhook signature verification failed: {exc}")

    result = await PaymentService(db).handle_verified_event(verified)
    return {"status": result.outcome, "event_id": result.event_id}
