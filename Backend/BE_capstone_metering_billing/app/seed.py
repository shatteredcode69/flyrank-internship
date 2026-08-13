"""
Seed script. Run with:  python -m app.seed
Creates the two plan rows and two demo tenants:
  - 'Boundary Test Co'  on Free, with 999 api_call usage events already
    recorded, so the very next call demonstrates the 999 -> 1000 -> 1001
    boundary live (see README demo script / EVIDENCE.md Probe 2).
  - 'Fresh Co'           on Free, with zero usage, for a clean walkthrough.
"""

import asyncio
import uuid

from app.database import AsyncSessionLocal, Base, engine
from app.models import Plan, Tenant, UsageEvent
from app.pricing import PLAN_QUOTAS


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        db.add(Plan(id="free", display_name="Free",
                     monthly_api_calls=PLAN_QUOTAS["free"]["api_calls"],
                     monthly_tokens=PLAN_QUOTAS["free"]["tokens"]))
        db.add(Plan(id="pro", display_name="Pro",
                     monthly_api_calls=PLAN_QUOTAS["pro"]["api_calls"],
                     monthly_tokens=PLAN_QUOTAS["pro"]["tokens"]))

        boundary_tenant = Tenant(id=str(uuid.uuid4()), name="Boundary Test Co", plan_id="free", status="active")
        fresh_tenant = Tenant(id=str(uuid.uuid4()), name="Fresh Co", plan_id="free", status="active")
        db.add(boundary_tenant)
        db.add(fresh_tenant)
        await db.flush()

        for i in range(999):
            db.add(UsageEvent(
                tenant_id=boundary_tenant.id,
                idempotency_key=f"seed-call-{i}",
                usage_type="api_call",
                api_call_qty=1,
                cost_micro_cents=200,
                response_snapshot={"seed": True, "index": i},
            ))

        await db.commit()
        print(f"Seeded plans: free, pro")
        print(f"Seeded tenant 'Boundary Test Co' -> {boundary_tenant.id}  (999/1000 api_calls used)")
        print(f"Seeded tenant 'Fresh Co'         -> {fresh_tenant.id}  (0/1000 api_calls used)")


if __name__ == "__main__":
    asyncio.run(seed())
