"""
Test suite runs against SQLite (aiosqlite), not Postgres — zero external
services required to run `pytest`. See BUILDLOG.md for why, and README
'Known limitations' for the one behavioral difference this implies
(SQLite enforces the same UNIQUE constraints Postgres does, so the
idempotency/dedup guarantees under test are identical; only Postgres-only
SQL features would differ, and the app deliberately avoids those — see
app/time_utils.py).
"""

import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("LOCAL_MOCK_WEBHOOK_SECRET", "test_local_secret")
os.environ.setdefault("STRIPE_WEBHOOK_SECRET", "whsec_test_secret")

import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models import Plan, Tenant


@pytest_asyncio.fixture
async def db_session():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
    async with session_factory() as session:
        session.add(Plan(id="free", display_name="Free", monthly_api_calls=1_000, monthly_tokens=100_000))
        session.add(Plan(id="pro", display_name="Pro", monthly_api_calls=50_000, monthly_tokens=5_000_000))
        await session.commit()
        yield session

    await engine.dispose()


@pytest_asyncio.fixture
async def tenant(db_session):
    t = Tenant(id=str(uuid.uuid4()), name="Test Tenant", plan_id="free", status="active")
    db_session.add(t)
    await db_session.commit()
    await db_session.refresh(t)
    return t


@pytest_asyncio.fixture
async def app_client(db_session):
    """A FastAPI TestClient wired to the SAME in-memory db_session's engine,
    via a dependency override, so HTTP-level tests share state with fixtures
    that set up tenants directly through the ORM."""
    from app.database import get_db
    from app.main import app

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()
