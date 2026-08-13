from fastapi import FastAPI

from app.routers import admin, usage, webhooks

app = FastAPI(
    title="Usage Metering & Billing Engine",
    description="FlyRank Backend Internship Capstone — idempotent metering, "
                 "quota enforcement, AI-token cost math, and Stripe test-mode billing.",
    version="1.0.0",
)

app.include_router(usage.router)
app.include_router(webhooks.router)
app.include_router(admin.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
