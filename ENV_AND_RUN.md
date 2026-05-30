# Environment variables and how to run

One file at the **repo root**: **`.env`**. Used by `backend/`, `web/`, `admin/`, and `docker compose`. No `backend/.env`, `web/.env.local`, or `admin/.env.local`.

Template (no secrets): [`.env.example`](.env.example)

| How you run | Command |
|-------------|---------|
| **Local dev** | `npm run dev` in `backend/`, `web/`, `admin/` (three terminals) |
| **Production** | `docker compose up` on the VM |

Deploy walkthrough: [VM_DEPLOYMENT_FROM_SCRATCH.md](VM_DEPLOYMENT_FROM_SCRATCH.md)

---

## Setup

```bash
cp .env.example .env
# edit .env — see variable reference below
chmod 600 .env   # on Linux VM
```

---

## Local dev (`npm run dev`)

**PostgreSQL** on your machine (or Docker on port 5432):

```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=hall_db postgres:18.4-alpine
```

Set `DATABASE_URL` in root `.env` to match (e.g. `postgresql://postgres:yourpassword@localhost:5432/hall_db`).

**Redis Cloud** — paste the **exact** connection URL from the Redis Cloud console into `REDIS_URL` (`redis://` or `rediss://` — use whichever the console shows for that endpoint). Same file for local and VM; use separate Redis Cloud databases if you want isolated sessions.

**Routing for local:**

| Variable | Typical local value |
|----------|---------------------|
| `BACKEND_API_URL` | `http://localhost:8000` (Next.js rewrites) |
| `STUDENT_URL` / `ADMIN_URL` | Your public HTTPS domains, or `http://localhost:3001` / `4001` |
| `API_PUBLIC_URL` | `http://localhost:8000`, or ngrok URL for SSLCommerz IPN testing |

CORS always allows `http://localhost:3001` and `http://localhost:4001` in addition to `STUDENT_URL` / `ADMIN_URL`.

First-time database:

```bash
cd backend
npm install
npm run db-all
```

Start (three terminals):

```bash
cd backend && npm run dev    # http://localhost:8000
cd web && npm install && npm run dev      # http://localhost:3001
cd admin && npm install && npm run dev    # http://localhost:4001
```

---

## Production (Docker Compose)

Copy the same root `.env` to the VM. `docker-compose.yml`:

- Builds `DATABASE_URL` for the backend container from `POSTGRES_*`
- Forces `BACKEND_API_URL=http://backend:8000` inside web/admin containers (ignores localhost in `.env`)

Ensure these use your **public HTTPS** domains:

- `API_PUBLIC_URL`
- `STUDENT_URL`
- `ADMIN_URL`

```bash
docker compose build
docker compose up -d
docker compose exec backend npm run db-all   # first time only
```

Checklist:

- [ ] DNS: `app`, `admin`, `api` → server
- [ ] `REDIS_URL` → Redis Cloud (VM outbound access)
- [ ] SSLCommerz IPN: `{API_PUBLIC_URL}/api/payments/sslcommerz/ipn`

---

## Variable reference

| Variable | Purpose |
|----------|---------|
| `POSTGRES_*` | Postgres container + compose `DATABASE_URL` |
| `DATABASE_URL` | Local `npm run dev` / `drizzle-kit` on host |
| `BACKEND_API_URL` | Local Next.js → backend (`http://localhost:8000`) |
| `API_PUBLIC_URL` | SSLCommerz callbacks / IPN (public API origin) |
| `STUDENT_URL` / `ADMIN_URL` | CORS + payment redirects |
| `REDIS_URL` | Redis Cloud — sessions (**required**) |
| `SESSION_TTL` | Session lifetime (e.g. `10d`) |
| `SSLCOMMERZ_*` | Online payments |
| `CLOUDINARY_*` | Uploads |
| `BREVO_*` / `EMAIL_FROM` | Optional email |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Next.js builds — generate once, keep stable |

Generate Next key:

```bash
openssl rand -base64 32
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Backend: `DATABASE_URL` not set | Set in root `.env`; run commands from repo with `.env` present |
| Cannot log in | Check `REDIS_URL`; Redis Cloud reachable from host/VM |
| Redis `ERR_SSL_PACKET_LENGTH_TOO_LONG` | Wrong scheme: try `redis://` instead of `rediss://` (or the reverse) — must match Redis Cloud for that port |
| Postgres unhealthy (`unused mount/volume`) | Postgres 18 needs volume at `/var/lib/postgresql`; run `docker compose down -v`, pull latest compose, `docker compose up -d` |
| API 404 from browser (local) | `BACKEND_API_URL=http://localhost:8000` in root `.env` |
| API 404 in Docker | Rebuild web/admin after env changes; compose uses `http://backend:8000` |
| CORS error | `STUDENT_URL` / `ADMIN_URL` match browser origin, or use localhost (allowed by default) |
| Payment IPN fails locally | Use ngrok for `API_PUBLIC_URL` and register IPN in merchant panel |

---

## Removed (do not use)

- `backend/.env`, `web/.env.local`, `admin/.env.local`
- `PAYMENT_SERVER_URL`, `PAY_SERVICE_SECRET` (old pay service)
- `ACCESS_TOKEN_*`, `REFRESH_TOKEN_*` (JWT removed; Redis sessions only)
