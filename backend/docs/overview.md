# Overview

## Purpose

The backend is the single API for hall operations at RUET:

- **Students** — register, apply for seats, book meals, pay dues, report damage, manage profile.
- **Hall staff** — provost and section officers manage admissions, dining, inventory, finance, and notifications.

Two frontends consume this API (student dashboard and admin panel). They use **credential cookies** (`credentials: true`) so the `sessionId` httpOnly cookie is sent on `/api/*` requests.

## Feature modules

| Module | Route prefix | Primary roles |
|--------|--------------|---------------|
| Auth | `/api/auth` | Public + all authenticated users |
| Profile | `/api/profile` | All roles |
| Dining | `/api/dining` | `STUDENT`, `DINING_MANAGER`, `ASST_DINING` |
| Admission | `/api/admission` | `STUDENT`, `DSW` (admin routes use `authorizeExactRoles`) |
| Inventory | `/api/inventory` | `STUDENT`, `ASST_INVENTORY`, `INVENTORY_SECTION_OFFICER` |
| Finance | `/api/finance` | `STUDENT`, `ASST_FINANCE`, `FINANCE_SECTION_OFFICER` |
| Payments | `/api/payments` | Public SSLCommerz callbacks (IPN, success/fail/cancel) |
| Notifications | `/api/notifications` | Authenticated users |

`PROVOST` bypasses role checks on any route that uses `authorizeRoles(...)`.

## Tech stack

| Layer | Choice |
|-------|--------|
| Runtime | Node.js, ESM (`"type": "module"`) |
| Language | TypeScript 5.9+ |
| HTTP | Express 5 |
| ORM | Drizzle ORM + PostgreSQL (`pg` / `node-postgres`) |
| Validation | Zod 4 |
| Sessions / cache | Redis 5 (`redis` package) |
| Passwords | bcrypt |
| Uploads | Multer → Cloudinary |
| Email | Nodemailer (Brevo SMTP) |
| Dev runner | `tsx` / `tsx watch` |

## Design principles

1. **MVC per feature** — `*.routes.ts` → middleware → `*.controller.ts`; shared DB helpers in `*.service.ts` when needed.
2. **Controllers own business logic** — most modules keep SQL and rules in controllers; services are thin.
3. **Uniform API shape** — successes use `ApiResponse`; failures throw `ApiError`.
4. **Validate at the edge** — Zod schemas in `*.validators.ts`, applied via `validateRequest`.
5. **Stateful auth in Redis** — PostgreSQL stores accounts; Redis stores live sessions and short-lived caches.

## Request lifecycle (summary)

```
Client → CORS → JSON parser → cookies → morgan
      → route: authenticateToken? → authorizeRoles? → validateRequest?
      → controller → ApiResponse JSON
      → (on error) handleError middleware
```

See [Architecture](./architecture.md) and [Authentication](./authentication.md) for detail.
