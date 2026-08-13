import os
from functools import lru_cache


class Settings:
    def __init__(self):
        self.database_url: str = os.getenv(
            "DATABASE_URL", "postgresql+asyncpg://postgres:postgres@db:5432/billing"
        )
        # SQLite fallback used automatically by tests (see tests/conftest.py) so the
        # test suite runs with zero external services.
        self.stripe_secret_key: str = os.getenv("STRIPE_SECRET_KEY", "sk_test_placeholder")
        self.stripe_webhook_secret: str = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_placeholder")
        self.stripe_price_id_pro: str = os.getenv("STRIPE_PRICE_ID_PRO", "price_placeholder")
        self.local_mock_webhook_secret: str = os.getenv(
            "LOCAL_MOCK_WEBHOOK_SECRET", "local_mock_secret_placeholder"
        )
        self.app_base_url: str = os.getenv("APP_BASE_URL", "http://localhost:8000")
        self.env: str = os.getenv("APP_ENV", "development")


@lru_cache
def get_settings() -> Settings:
    return Settings()
