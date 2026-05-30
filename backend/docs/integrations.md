# External integrations

## Redis

**Package:** `redis` v5  
**Client:** `src/lib/redis.ts` — single shared connection, reconnect with backoff.

| Use | Module | Required? |
|-----|--------|-----------|
| Live sessions | `sessionStore.ts` | **Yes** for login/logout/protected auth |
| Account cache (30s) | `cache.ts` + `auth.middleware.ts` | No — falls back to PostgreSQL |
| Active academic sessions list (5min) | `cache.ts` + `auth.controller.ts` | No |

Env: `REDIS_URL` — [Redis Cloud](https://redis.io/cloud/) connection URL (e.g. `rediss://default:password@host:port`). Use separate databases for local dev and production when possible.

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

## SSLCommerz (payments)

**Module:** `src/utils/sslcommerz.ts`, `src/modules/payments/`  
**Constants:** `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_IS_SANDBOX`, `API_PUBLIC_URL` in `src/Constants.ts`

| Variable | Required | Description |
|----------|----------|-------------|
| `SSLCOMMERZ_STORE_ID` | For online checkout | Sandbox store ID from [developer.sslcommerz.com](https://developer.sslcommerz.com/registration/) |
| `SSLCOMMERZ_STORE_PASSWORD` | For online checkout | Store password |
| `SSLCOMMERZ_IS_SANDBOX` | No | Default `true`; set `false` for live (`securepay.sslcommerz.com`) |
| `API_PUBLIC_URL` | Yes for IPN/callbacks | Public backend URL, e.g. `https://api.example.com` or `http://localhost:8000` locally |

Flow: finance/dining initiate a session → client redirects to `GatewayPageURL` → IPN and browser callbacks (primary `POST`, fallback `GET`) validate via SSLCommerz Order Validation API → `payment_intents` row marked `COMPLETED` and due/meal booking finalized.

IPN must be reachable from the internet (use ngrok for local dev). Configure the same IPN URL in the SSLCommerz merchant panel if required.

Official sandbox test cards:

- Visa: `4111111111111111`
- Mastercard: `5111111111111111`
- Amex: `371111111111111`
- Expiry: use any future month/year
- CVV: `111`
- 3DS / OTP (when prompted): `111111` (or any valid test OTP shown by gateway prompt)

## CORS

Configured in `src/app.ts`:

- Origins: `STUDENT_URL`, `ADMIN_URL`, plus localhost `3001` / `4001`
- `credentials: true` for session cookies

## Receipt PDF / HTML

`src/utils/receiptTemplate.ts` — server-side receipt layout for payments (not a third-party service).

## Docker Compose

Root compose files inject `DATABASE_URL`, `REDIS_URL`, Cloudinary, CORS URLs, and SMTP into the backend container. Redis is **not** defined as a service in compose — provide `REDIS_URL` pointing to your instance (e.g. managed Redis or a host install).
