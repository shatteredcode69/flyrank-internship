# Local development

## Prerequisites

- Docker + Docker Compose (recommended path)
- OR: Node.js 20+, a local PostgreSQL 16, and a local Redis 7 if you prefer running outside
  Docker

## Quick start (Docker)

```bash
cp .env.example .env
# generate real values for ENCRYPTION_KEY and WEBHOOK_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"   # -> ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"      # -> WEBHOOK_SECRET
# paste both into .env, and set WEBHOOK_SECRET as an env var for docker-compose too:
export WEBHOOK_SECRET=<same value you put in .env>

docker compose up --build
# in a second terminal, once the stack is healthy:
docker compose exec api npm run db:migrate
docker compose exec api npm run db:seed
```

API: http://localhost:3000 · Swagger UI: http://localhost:3000/docs · Fake platform:
http://localhost:4000

## Without Docker

```bash
npm install
cp .env.example .env   # point DATABASE_URL/REDIS_URL at your local instances
npm run db:migrate
cd fake-platform && npm install && npm run dev &   # separate terminal
cd .. && npm run dev            # API
npm run worker:dev              # separate terminal
npm run db:seed
```

## Common commands

| Command | What it does |
|---|---|
| `npm run dev` | API with hot reload |
| `npm run worker:dev` | worker with hot reload |
| `npm test` | full test suite |
| `npm run lint` / `npm run typecheck` | code quality gates |
| `npm run db:seed` | create demo campaign + fake accounts |
| `npm run db:reset` | wipe all application tables |
