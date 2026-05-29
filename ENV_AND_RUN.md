# Environment variables and how to run

| Environment | How you run | Env files |
|-------------|-------------|-----------|
| **Development (local)** | `npm run dev` on your machine — **no Docker** | `backend/.env`, `web/.env.local`, `admin/.env.local` |
| **Production (server)** | Everything in **Docker Compose** + nginx | Root **`.env`** on the VM only |

Related docs:

- [VM_DEPLOYMENT_FROM_SCRATCH.md](VM_DEPLOYMENT_FROM_SCRATCH.md) — full VM deploy (SSL, nginx)
- [backend/docs/getting-started.md](backend/docs/getting-started.md) — backend API details
- [backend/docs/integrations.md](backend/docs/integrations.md) — SSLCommerz, Redis, Cloudinary

---

## Development (local) — `npm run dev`, no Docker

You need **PostgreSQL** and **Redis** running on your machine (install natively or run only those two in Docker — the app processes themselves stay on the host).

### 1. Copy env templates

```bash
cp backend/.env.example backend/.env
cp web/.env.example web/.env.local
cp admin/.env.example admin/.env.local
```

You do **not** need a root `.env` for this workflow (root `.env` is for production Compose on the server).

### 2. `backend/.env` (required)

```env
# Postgres on your machine (default port 5432)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/hall_db

REDIS_URL=redis://localhost:6379
SESSION_TTL=10d
PORT=8000

STUDENT_URL=http://localhost:3001
ADMIN_URL=http://localhost:4001
API_PUBLIC_URL=http://localhost:8000

SSLCOMMERZ_STORE_ID=your_sandbox_store_id
SSLCOMMERZ_STORE_PASSWORD=your_sandbox_store_password
SSLCOMMERZ_IS_SANDBOX=true

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

BREVO_SMTP_HOST=
BREVO_SMTP_PORT=465
BREVO_SMTP_USER=
BREVO_SMTP_PASS=
EMAIL_FROM=

NODE_ENV=development
```

| Variable | Why you need it |
|----------|-----------------|
| `DATABASE_URL` | Drizzle / API data |
| `REDIS_URL` | Login sessions (**required**) |
| `STUDENT_URL` / `ADMIN_URL` | CORS from browser |
| `API_PUBLIC_URL` | SSLCommerz callback URLs (use ngrok URL if testing IPN from internet) |
| `SSLCOMMERZ_*` | ONLINE dues / BKASH-NAGAD-ROCKET meal payments |
| `CLOUDINARY_*` | Receipt / avatar uploads |

First-time database (in `backend/`):

```bash
cd backend
npm install
npm run db-all          # push schema + seed (local only)
# later schema updates:
npm run db              # or npm run db:migrate
```

Start API:

```bash
cd backend
npm run dev
```

API: http://localhost:8000

### 3. `web/.env.local` and `admin/.env.local` (required for frontends)

Both only need the backend URL for Next.js rewrites (`/api/*` → backend):

```env
BACKEND_API_URL=http://localhost:8000
```

Start student app (terminal 2):

```bash
cd web
npm install
npm run dev
```

→ http://localhost:3001

Start admin app (terminal 3):

```bash
cd admin
npm install
npm run dev
```

→ http://localhost:4001

### 4. Prerequisites on your machine

| Service | How to run (examples) |
|---------|------------------------|
| PostgreSQL 18+ | Local install, or `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=... postgres:18.4-alpine` |
| Redis | Local install, or `docker run -d -p 6379:6379 redis:alpine` |

If Postgres runs in Docker on port **5433**, set `DATABASE_URL=...@localhost:5433/hall_db`.

### 5. SSLCommerz on local dev

- Checkout redirect works with `API_PUBLIC_URL=http://localhost:8000`.
- **IPN** (server-to-server) from SSLCommerz **cannot** reach `localhost`. For full payment completion testing, use [ngrok](https://ngrok.com/) (or similar), set `API_PUBLIC_URL=https://your-tunnel.ngrok-free.app`, and register that IPN URL in the sandbox merchant panel.

Sandbox card: `4111111111111111`, exp `12/25`, CVV `111`.

---

## Production (server) — Docker Compose

All services run in containers. Env lives in **one root `.env`** on the VM; Compose injects values into backend, web, and admin.

```bash
cp .env.example .env
# edit .env on the server — see template below
chmod 600 .env
```

You do **not** use `backend/.env` or `web/.env.local` on the server for the normal deploy (Compose sets env for containers).

### Root `.env` on the server

```env
POSTGRES_USER=halladmin
POSTGRES_PASSWORD=strong-db-password
POSTGRES_DB=hall_db

BACKEND_PORT=8000
BACKEND_API_URL=http://backend:8000

API_PUBLIC_URL=https://api.yourdomain.com
STUDENT_URL=https://app.yourdomain.com
ADMIN_URL=https://admin.yourdomain.com

REDIS_URL=redis://your-redis-host:6379
SESSION_TTL=10d

SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
SSLCOMMERZ_IS_SANDBOX=false

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

BREVO_SMTP_HOST=...
BREVO_SMTP_PORT=465
BREVO_SMTP_USER=...
BREVO_SMTP_PASS=...
EMAIL_FROM=noreply@yourdomain.com

NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=stable-production-key

NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
```

| Variable | Production notes |
|----------|------------------|
| `BACKEND_API_URL` | **Docker internal** hostname: `http://backend:8000` (Next.js rewrites inside containers) |
| `API_PUBLIC_URL` | **Public HTTPS** API domain — SSLCommerz IPN/callbacks |
| `STUDENT_URL` / `ADMIN_URL` | Public HTTPS app URLs — CORS + payment redirect |
| `POSTGRES_*` | Used by Compose to build `DATABASE_URL` for the backend container |

Deploy:

```bash
cd ~/ruet-hall-mgmt
git pull
docker compose build
docker compose up -d
docker compose exec backend npm run db:migrate   # after schema changes
```

Full walkthrough: [VM_DEPLOYMENT_FROM_SCRATCH.md](VM_DEPLOYMENT_FROM_SCRATCH.md).

Production checklist:

- [ ] DNS: `app`, `admin`, `api` → server
- [ ] SSLCommerz IPN: `{API_PUBLIC_URL}/api/payments/sslcommerz/ipn`
- [ ] Redis reachable from backend container
- [ ] No `pay` service (removed — payments are in backend)

---

## Optional: local development with Docker Compose

If you prefer containers locally instead of `npm run dev`, use [docker-compose.local.yml](docker-compose.local.yml) and a **root `.env`** (see [.env.example](.env.example)). That path is separate from the host-only workflow above.

---

## Variable reference (both environments)

### Auth

| Variable | Local (`backend/.env`) | Production (root `.env`) |
|----------|------------------------|---------------------------|
| `REDIS_URL` | `redis://localhost:6379` | your production Redis |
| `SESSION_TTL` | `10d` | `10d` |

### SSLCommerz

| Variable | Local | Production |
|----------|-------|------------|
| `SSLCOMMERZ_STORE_ID` | sandbox | live |
| `SSLCOMMERZ_STORE_PASSWORD` | sandbox | live |
| `SSLCOMMERZ_IS_SANDBOX` | `true` | `false` |
| `API_PUBLIC_URL` | `http://localhost:8000` (or ngrok) | `https://api.yourdomain.com` |

### Frontends

| Variable | Local | Production |
|----------|-------|------------|
| `BACKEND_API_URL` | `web/.env.local`, `admin/.env.local` → `http://localhost:8000` | root `.env` → `http://backend:8000` |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | optional for dev | **required** in root `.env` for builds |

Generate encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Production-only (root `.env`)

`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `NGINX_HTTP_PORT`, `NGINX_HTTPS_PORT` — not used when you only run `npm run dev` locally.

---

## Troubleshooting

| Problem | Local dev | Production |
|---------|-----------|------------|
| Cannot log in | Redis running? `REDIS_URL` in `backend/.env` | `REDIS_URL` in root `.env` |
| API 404 from browser | `BACKEND_API_URL` in `web/.env.local` / `admin/.env.local` | `BACKEND_API_URL=http://backend:8000` |
| CORS error | `STUDENT_URL` / `ADMIN_URL` in `backend/.env` match browser URL | Same in root `.env` with HTTPS domains |
| Payment stuck after SSLCommerz | IPN needs public URL (ngrok locally) | `API_PUBLIC_URL` + merchant IPN setting |
| Upload fails | Cloudinary in `backend/.env` | Cloudinary in root `.env` |

---

## Removed variables

Do not use (old payment microservice):

- `PAYMENT_SERVER_URL`
- `PAYMENT_SERVER_PORT`
- `PAY_SERVICE_SECRET`
