-- Usage Metering & Billing Engine — schema.sql
-- Run automatically by docker-compose (mounted into postgres:/docker-entrypoint-initdb.d/)
-- or manually:  psql $DATABASE_URL -f migrations/schema.sql

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- Extension for UUID generation
-- ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ────────────────────────────────────────────────────────────────
-- plans: static catalog of Free / Pro (seeded, rarely written)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
    id                  TEXT PRIMARY KEY,              -- 'free' | 'pro'
    display_name        TEXT NOT NULL,
    monthly_api_calls    BIGINT NOT NULL,               -- quota, per calendar month
    monthly_tokens       BIGINT NOT NULL,               -- quota, per calendar month
    stripe_price_id      TEXT,                          -- null for free plan
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────
-- tenants: one row per customer organization
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL,
    plan_id             TEXT NOT NULL REFERENCES plans(id) DEFAULT 'free',
    stripe_customer_id  TEXT UNIQUE,                    -- set once Checkout is created
    status              TEXT NOT NULL DEFAULT 'active',  -- active | past_due | canceled
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer_id ON tenants(stripe_customer_id);

-- ────────────────────────────────────────────────────────────────
-- subscriptions: mirrors Stripe subscription state (payment truth
-- lives at Stripe; this table is a verified-event-driven mirror)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider                TEXT NOT NULL,               -- 'stripe' | 'local_mock'
    provider_subscription_id TEXT NOT NULL,
    plan_id                 TEXT NOT NULL REFERENCES plans(id),
    status                  TEXT NOT NULL,                -- active | past_due | canceled | incomplete
    current_period_start    TIMESTAMPTZ,
    current_period_end      TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(provider, provider_subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);

-- ────────────────────────────────────────────────────────────────
-- usage_events: append-only ledger of every billable action.
-- The idempotency_key + tenant_id unique constraint is the entire
-- exactly-once guarantee — see MeteringService.record().
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usage_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    idempotency_key     TEXT NOT NULL,
    usage_type          TEXT NOT NULL,                   -- 'api_call' | 'ai_tokens'
    -- quantities (only the relevant ones are non-zero per usage_type)
    api_call_qty        BIGINT NOT NULL DEFAULT 0,
    input_tokens        BIGINT NOT NULL DEFAULT 0,
    cached_input_tokens BIGINT NOT NULL DEFAULT 0,
    output_tokens       BIGINT NOT NULL DEFAULT 0,
    reasoning_tokens    BIGINT NOT NULL DEFAULT 0,
    -- cost snapshot at time of recording, integer micro-cents (never float)
    cost_micro_cents    BIGINT NOT NULL DEFAULT 0,
    -- full request body of the FIRST attempt, returned verbatim on retries
    response_snapshot   JSONB NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- THE core idempotency guarantee: one (tenant, key) pair -> one row, ever.
    CONSTRAINT uq_tenant_idempotency_key UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_created ON usage_events(tenant_id, created_at);

-- ────────────────────────────────────────────────────────────────
-- webhook_events: dedup ledger for inbound provider webhooks.
-- provider_event_id is globally unique per provider (Stripe's
-- evt_... id, or the local mock adapter's generated id).
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider            TEXT NOT NULL,                   -- 'stripe' | 'local_mock'
    provider_event_id   TEXT NOT NULL,
    event_type          TEXT NOT NULL,
    payload             JSONB NOT NULL,
    processed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_provider_event UNIQUE (provider, provider_event_id)
);

COMMIT;
