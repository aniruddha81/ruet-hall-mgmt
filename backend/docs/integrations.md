# External integrations

## Redis

**Package:** `redis` v5  
**Client:** `src/lib/redis.ts` — single shared connection, reconnect with backoff.

| Use | Module | Required? |
|-----|--------|-----------|
| Live sessions | `sessionStore.ts` | **Yes** for login/logout/protected auth |
| Account cache (30s) | `cache.ts` + `auth.middleware.ts` | No — falls back to PostgreSQL |
| Active academic sessions list (5min) | `cache.ts` + `auth.controller.ts` | No |

Env: `REDIS_URL` (e.g. `redis://localhost:6379`).

Shutdown: `closeRedis()` from `src/index.ts` on SIGINT/SIGTERM.

## PostgreSQL

Env: `DATABASE_URL`.  
All durable entities (users, menus, dues, notifications, …).

## Cloudinary

**Module:** `src/utils/cloudinary.ts`  
**Env:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

Used for:

- Profile avatars (`POST /api/profile/upload-image`)
- Meal booking receipts (`multipart` field `receiptImage`)
- Due payment receipts
- Damage report images

Upload flow: Multer memory/disk → Cloudinary upload in controller.

## Email (Brevo SMTP)

**Module:** `src/utils/email.ts`  
**Env:** `BREVO_SMTP_HOST`, `BREVO_SMTP_PORT`, `BREVO_SMTP_USER`, `BREVO_SMTP_PASS`, `EMAIL_FROM`

Used for transactional mail from auth/admission flows where implemented.

## Payment service

**Constants:** `PAYMENT_SERVER_URL`, `PAY_SERVICE_SECRET` in `src/Constants.ts`

External payment microservice for verifying or initiating payments (see finance/dining controllers for call sites). Default dev URL: `http://localhost:8080`.

## CORS

Configured in `src/app.ts`:

- Origins: `STUDENT_URL`, `ADMIN_URL`, plus localhost `3001` / `4001`
- `credentials: true` for session cookies

## Receipt PDF / HTML

`src/utils/receiptTemplate.ts` — server-side receipt layout for payments (not a third-party service).

## Docker Compose

Root compose files inject `DATABASE_URL`, `REDIS_URL`, Cloudinary, CORS URLs, and SMTP into the backend container. Redis is **not** defined as a service in compose — provide `REDIS_URL` pointing to your instance (e.g. managed Redis or a host install).
