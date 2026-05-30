# Getting started

For **monorepo-wide** env files, Docker Compose, SSLCommerz, and production vs development run steps, see the repo root guide: [ENV_AND_RUN.md](../../ENV_AND_RUN.md).

## Prerequisites

- Node.js (LTS recommended)
- PostgreSQL 18+ (or Docker: official `postgres:18.4-alpine` image)
- Redis Cloud (`REDIS_URL` in root `.env`)
- Optional: Docker via repo root `docker-compose.yml` / `docker-compose.local.yml`

## Install

```bash
cd backend
npm install
```

## Environment variables

Use the **repo root** `.env` only (see [`.env.example`](../../.env.example)). `backend/src/loadEnv.ts` loads it automatically.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes (local) | PostgreSQL on host, e.g. `postgresql://user:pass@localhost:5432/hall_db` (port `5433` if using `docker-compose.local.yml` for Postgres only) |
| `REDIS_URL` | Yes for auth | Redis Cloud URL from console (`redis://` or `rediss://`) |
| `PORT` | No | Default `8000` |
| `NODE_ENV` | No | `development` or `production` |
| `SESSION_TTL` | No | Redis session TTL (default `10d`) |
| `SESSION_COOKIE_SAMESITE` | No | Cookie same-site policy: `lax` (default), `strict`, `none` |
| `SESSION_COOKIE_SECURE` | No | Optional cookie secure override (`true`/`false`). `none` same-site always forces secure |
| `STUDENT_URL` | No | CORS origin for student app (e.g. `http://localhost:3001`) |
| `ADMIN_URL` | No | CORS origin for admin app (e.g. `http://localhost:4001`) |
| `CLOUDINARY_*` | For uploads | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| `BREVO_SMTP_*` | For email | `BREVO_SMTP_HOST`, `BREVO_SMTP_PORT`, `BREVO_SMTP_USER`, `BREVO_SMTP_PASS` |
| `EMAIL_FROM` | No | Default sender address |
| `SSLCOMMERZ_STORE_ID` | For online payments | Sandbox/live store ID |
| `SSLCOMMERZ_STORE_PASSWORD` | For online payments | Store password |
| `SSLCOMMERZ_IS_SANDBOX` | No | Default `true` (sandbox gateway) |
| `API_PUBLIC_URL` | For online payments | Public URL of this API (callbacks/IPN), e.g. `http://localhost:8000` |

Docker Compose uses the same root `.env` and sets `DATABASE_URL` inside the backend container from `POSTGRES_*`.

| Compose file | DB image | Host port → container |
|--------------|----------|------------------------|
| `docker-compose.local.yml` | `postgres:18.4-alpine` | `5433` → `5432` |
| `docker-compose.yml` (production) | `postgres:18.4-alpine` | `5432` → `5432` |

The Postgres service creates `POSTGRES_DB` on first start; run migrations after the healthcheck passes.

## Database setup

```bash
# Generate SQL migrations from schema changes (commit drizzle/ output)
npm run db:generate

# Apply migrations (CI / production)
npm run db:migrate

# Push schema directly without migration files (local quick sync)
npm run db

# Local only: force-push schema + seed sample data
npm run db-all
```

Schema lives in `src/db/models/*.ts`. Seeds: `src/db/seed.ts`.

## Run the server

```bash
# Development (hot reload)
npm run dev

# Production mode
npm run start
```

- Root health: `GET http://localhost:8000/`
- API base: `http://localhost:8000/api`

## Test with Postman

Import requests from `backend/postman/collections/ruet-hall-mgmt-api/`.

For protected routes:

1. Call login (`/api/auth/login` or `/api/auth/admin/login`).
2. Postman stores the `sessionId` cookie, or send `Authorization: Bearer <sessionId>`.

## Full stack (Docker)

From the repository root:

```bash
docker compose -f docker-compose.local.yml up --build
```

After Postgres is healthy, apply schema and seed (first time):

```bash
docker compose -f docker-compose.local.yml exec backend npm run db-all
```

See [VM deployment runbook](../../VM_DEPLOYMENT_FROM_SCRATCH.md) for production (`docker-compose.yml`, same `postgres:18.4-alpine` image).

## Next steps

- [Architecture](./architecture.md) — code layout
- [Authentication](./authentication.md) — how sessions work
- [API index](./api/README.md) — endpoint list
