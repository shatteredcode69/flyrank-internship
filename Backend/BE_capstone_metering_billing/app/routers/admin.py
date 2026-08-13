from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models import Tenant
from app.services.adapters.local_mock_adapter import LocalMockAdapter
from app.services.adapters.stripe_adapter import StripeAdapter

router = APIRouter(prefix="/api/v1", tags=["admin"])
settings = get_settings()


class CreateTenantRequest(BaseModel):
    name: str
    plan_id: str = "free"


@router.post("/tenants", status_code=201)
async def create_tenant(body: CreateTenantRequest, db: AsyncSession = Depends(get_db)):
    tenant = Tenant(name=body.name, plan_id=body.plan_id, status="active")
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)
    return {"tenant_id": tenant.id, "name": tenant.name, "plan_id": tenant.plan_id}


@router.post("/billing/checkout/stripe")
async def create_stripe_checkout(tenant_id: str, db: AsyncSession = Depends(get_db)):
    tenant = await db.get(Tenant, tenant_id)
    if tenant is None:
        raise HTTPException(status_code=404, detail="Unknown tenant_id")
    adapter = StripeAdapter(
        api_key=settings.stripe_secret_key,
        webhook_secret=settings.stripe_webhook_secret,
        price_id_pro=settings.stripe_price_id_pro,
    )
    return adapter.create_checkout_session(tenant_id=tenant.id, plan_id="pro")


@router.post("/billing/checkout/local")
async def create_local_checkout(tenant_id: str, db: AsyncSession = Depends(get_db)):
    tenant = await db.get(Tenant, tenant_id)
    if tenant is None:
        raise HTTPException(status_code=404, detail="Unknown tenant_id")
    adapter = LocalMockAdapter(webhook_secret=settings.local_mock_webhook_secret)
    return adapter.create_checkout_session(tenant_id=tenant.id, plan_id="pro")
