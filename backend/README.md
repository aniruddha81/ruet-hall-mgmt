# RUET Hall Management Backend

Express + Drizzle API for the RUET Hall Management system.

## Documentation

**Full backend docs:** [`docs/README.md`](./docs/README.md)

| Topic | Link |
|-------|------|
| Overview & modules | [docs/overview.md](./docs/overview.md) |
| Setup & env | [docs/getting-started.md](./docs/getting-started.md) |
| Architecture | [docs/architecture.md](./docs/architecture.md) |
| Auth & sessions | [docs/authentication.md](./docs/authentication.md) |
| Database | [docs/database.md](./docs/database.md) |
| API reference | [docs/api/README.md](./docs/api/README.md) |

Agent / LLM rules: [`AGENTS.md`](./AGENTS.md) · Doc sync: [`docs/DOC_SYNC.md`](./docs/DOC_SYNC.md)

## Quick start

```bash
npm install
# Configure .env (DATABASE_URL, REDIS_URL, …)
npm run dev
```

API: `http://localhost:8000/api`

## Database

```bash
npm run db:generate   # migrations from schema
npm run db:migrate    # apply migrations
npm run db            # push schema (local)
npm run db-all        # local: push + seed
npm run docs:manifest # refresh route manifest for docs
npm run docs:check    # verify api/*.md lists all routes
```

## Docker

Use root compose files for backend + PostgreSQL 18 (`postgres:18.4-alpine`) + frontends:

```bash
docker compose -f docker-compose.local.yml up --build
# First-time schema + seed (after postgres is healthy):
docker compose -f docker-compose.local.yml exec backend npm run db-all
```

Deployment: [VM_DEPLOYMENT_FROM_SCRATCH.md](../VM_DEPLOYMENT_FROM_SCRATCH.md)
