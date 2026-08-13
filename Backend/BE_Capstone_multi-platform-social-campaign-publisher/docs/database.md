# Database

PostgreSQL via Prisma. Schema: `prisma/schema.prisma`; hand-verified initial migration:
`prisma/migrations/000001_init/migration.sql`.

## ER diagram

```mermaid
erDiagram
    Campaign ||--o{ SocialPost : has
    SocialAccount ||--o{ SocialPost : "publishes as"
    SocialPost ||--o{ WebhookEvent : "receives"
    SocialPost ||--|| IdempotencyRecord : "guarded by (via idempotencyKey)"

    Campaign {
        string id PK
        string title
        string body
        string sourceUrl
        string sourceImage
        enum status
        datetime scheduledAt
    }
    SocialAccount {
        string id PK
        enum platform
        string externalAccountId
        string encryptedToken
        string tokenIv
        string tokenAuthTag
    }
    SocialPost {
        string id PK
        string campaignId FK
        enum platform
        string socialAccountId FK
        string imagePath
        int imageWidth
        int imageHeight
        string caption
        string idempotencyKey UK
        enum status
        string externalPostId
        int attempts
        datetime scheduledAt
        datetime publishedAt
    }
    IdempotencyRecord {
        string id PK
        string idempotencyKey UK
        string socialPostId
        enum status
        string externalPostId
    }
    WebhookEvent {
        string id PK
        string socialPostId FK
        string platformEventId UK
        enum platform
        boolean signatureValid
        json payload
    }
```

## Invariants enforced at the database level (not just application code)

- `SocialPost.idempotencyKey` — `UNIQUE`. Two processes racing to create the same logical
  publish request can never end up with two rows.
- `SocialPost.(campaignId, platform)` — `UNIQUE`. One post per platform per campaign, period.
- `IdempotencyRecord.idempotencyKey` — `UNIQUE`. The idempotency ledger itself cannot be
  double-inserted.
- `WebhookEvent.platformEventId` — `UNIQUE`. Replay protection: a re-delivered webhook is a
  no-op, enforced by the database, not just an in-memory check.
- Foreign keys with explicit `ON DELETE` behavior (`CASCADE` for `SocialPost.campaignId`,
  `SET NULL` for `WebhookEvent.socialPostId`) so referential integrity survives cleanup.

## Indexes

`Campaign.status`, `Campaign.scheduledAt`, `SocialPost.status`, `SocialPost.scheduledAt`,
`WebhookEvent.signatureValid` — all support the query patterns actually used by the worker's
recovery sweep and the campaign-status dashboard read path.
