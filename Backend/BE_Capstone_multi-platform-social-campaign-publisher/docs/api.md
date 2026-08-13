# API reference

Full machine-readable spec: `docs/openapi.yaml`, served at `/docs` (Swagger UI) when the API
is running.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Verifies DB + Redis connectivity |
| POST | `/api/campaigns` | Create a campaign — generates image variants + captions for every platform |
| GET | `/api/campaigns` | List campaigns (cursor pagination) |
| GET | `/api/campaigns/:id` | Get a campaign with its social posts |
| POST | `/api/campaigns/:id/schedule` | Schedule all of a campaign's posts for durable publishing |
| POST | `/api/social-posts/:id/publish` | Publish one post immediately — idempotent, safe to call repeatedly |
| GET | `/api/social-posts/:id` | Get a post's current status |
| POST | `/webhook/social-delivery` | Signed delivery webhook from the fake platform |

## Example: create a campaign

```bash
curl -X POST http://localhost:3000/api/campaigns \
  -H 'content-type: application/json' \
  -d '{
    "title": "How We Cut Cold-Start Latency by 80%",
    "body": "We rebuilt our request-routing layer around a warm-pool strategy...",
    "sourceUrl": "https://blog.example.com/cold-start-latency",
    "sourceImagePath": "storage/generated/seed-source.jpg"
  }'
```

## Example: schedule it

```bash
curl -X POST http://localhost:3000/api/campaigns/<id>/schedule \
  -H 'content-type: application/json' \
  -d '{"scheduledAt": "2026-08-14T12:05:00.000Z"}'
```

## Example: hammer the idempotency probe

```bash
for i in 1 2 3 4 5; do
  curl -s -X POST http://localhost:3000/api/social-posts/<social-post-id>/publish &
done
wait
# then confirm exactly one externalPostId exists:
curl -s http://localhost:3000/api/social-posts/<social-post-id> | jq .externalPostId
```

## Error shape

```json
{
  "error": {
    "type": "ValidationError",
    "message": "Request validation failed",
    "details": { "issues": [ /* zod issues */ ] },
    "correlationId": "req_..."
  }
}
```
