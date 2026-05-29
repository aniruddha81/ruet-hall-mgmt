# Getting started

## Prerequisites

- Node.js (LTS recommended)
- MySQL 8+
- Redis (required for login and sessions in production)
- Optional: Docker via repo root `docker-compose.yml` / `docker-compose.local.yml`

## Install

```bash
cd backend
npm install
```

## Environment variables

Create `backend/.env` (not committed). Minimum for local dev:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | MySQL connection string, e.g. `mysql://user:pass@localhost:3306/hall_mgmt` |
| `REDIS_URL` | Yes for auth | Redis URL, e.g. `redis://localhost:6379` |
| `PORT` | No | Default `8000` |
| `NODE_ENV` | No | `development` or `production` |
| `SESSION_TTL` | No | Redis session TTL (default `10d`) |
| `STUDENT_URL` | No | CORS origin for student app (e.g. `http://localhost:3001`) |
| `ADMIN_URL` | No | CORS origin for admin app (e.g. `http://localhost:4001`) |
| `CLOUDINARY_*` | For uploads | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| `BREVO_SMTP_*` | For email | `BREVO_SMTP_HOST`, `BREVO_SMTP_PORT`, `BREVO_SMTP_USER`, `BREVO_SMTP_PASS` |
| `EMAIL_FROM` | No | Default sender address |
| `PAYMENT_SERVER_URL` | No | External payment service (default `http://localhost:8080`) |
| `PAY_SERVICE_SECRET` | No | Shared secret for payment callbacks |

Docker Compose at the repo root wires many of these into the backend service; see root `.env` / compose files.

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

See [VM deployment runbook](../../VM_DEPLOYMENT_FROM_SCRATCH.md) for production.

## Next steps

- [Architecture](./architecture.md) — code layout
- [Authentication](./authentication.md) — how sessions work
- [API index](./api/README.md) — endpoint list
