# Authentication & authorization

## Session model

Authentication is **session-based**, not JWT-in-localStorage:

1. User logs in → server creates a **live session** in Redis.
2. Server sets an httpOnly cookie `sessionId` (opaque UUID).
3. Each protected request resolves that id from the cookie or `Authorization: Bearer <sessionId>`.
4. Server loads the account from PostgreSQL (with a short Redis cache) and attaches `req.user`.

Cookie settings are set in `auth.service.ts` (`httpOnly`, `sameSite=strict`, `secure` in production, path `/`).

Constants: `SESSION_COOKIE_NAME`, `SESSION_TTL` in `src/Constants.ts`.

## Redis keys

| Key | Type | Content |
|-----|------|---------|
| `hallmgmt:session:{sessionId}` | String (JSON) | User payload, IP, user agent, timestamps; TTL = session lifetime |
| `hallmgmt:sessions:user:{userId}` | Set | Active session ids for that account |

Implementation: `src/lib/sessionStore.ts`.

### Device limit

At most **2 concurrent live sessions** per user. A third login returns `403` until another device logs out or sessions expire.

### Sliding expiration

`touchSession` refreshes TTL on each authenticated request (default **10 days**, configurable via `SESSION_TTL`).

## Account hydration

`authenticateToken` (`src/middlewares/auth.middleware.ts`):

1. Read `sessionId` from cookie or Bearer header.
2. `getSession` from Redis; `touchSession`.
3. Load `uni_students` or `hall_admins` from PostgreSQL.
4. Cache row for **30 seconds** (`cacheKeys.authAccountStudent` / `authAccountAdmin`).
5. Reject deactivated students, non-`ACTIVE` status, inactive or unapproved admins; revoke all sessions and clear cookie.

Request extensions (see `express.d.ts`):

- `req.user` — `{ userId, email, name, role, hall?, rollNumber? }`
- `req.authAccount` — full DB row (`STUDENT` or `ADMIN`)
- `req.sessionId` — current session id

## Authorization

`authorizeRoles(...allowedRoles)`:

- **`PROVOST`** always allowed.
- Otherwise `req.user.role` must be in `allowedRoles`.
- Empty `authorizeRoles()` (e.g. admin approval routes) → **only PROVOST**.

Staff roles are stored on `hall_admins.designation` and exposed as `req.user.role`.

### Role reference

| Role | Typical access |
|------|----------------|
| `PROVOST` | Super admin; all `authorizeRoles` gates |
| `ASST_FINANCE`, `FINANCE_SECTION_OFFICER` | Dues, expenses, ledgers, receipt verification |
| `ASST_DINING`, `DINING_MANAGER` | Menus, tokens, dining reports |
| `ASST_INVENTORY`, `INVENTORY_SECTION_OFFICER` | Rooms, damage reports |
| `STUDENT` | Own data: meals, applications, dues, profile |

Full list: `src/types/enums.ts` → `ROLES`.

## Login responses

**Student** — `POST /api/auth/login` → `data.student_data`.

**Admin** — `POST /api/auth/admin/login` → `data.user`.

Passwords are hashed with bcrypt in controllers/services.

## Session management endpoints

| Method | Path | Action |
|--------|------|--------|
| `POST` | `/api/auth/logout` | Revoke current session |
| `POST` | `/api/auth/logout-all` | Revoke all sessions for user |
| `GET` | `/api/auth/devices` | List live sessions |
| `DELETE` | `/api/auth/devices/:sessionId` | Revoke one device |

## Registration rate limit

`POST /api/auth/register` and `POST /api/auth/admin/register` use an in-memory limiter: **5 requests per IP per 15 minutes**.

## Failure modes

| Condition | Behavior |
|-----------|----------|
| `REDIS_URL` unset / Redis down | `getRedis()` returns `null`; session create/required paths → **503**; cache reads miss |
| Invalid / expired session | **401**, cookie cleared |
| Wrong role | **403** |

## Frontend integration

- Browser: `fetch(..., { credentials: "include" })` so `sessionId` is sent.
- API clients: `Authorization: Bearer <sessionId>` with the same opaque id.

See [api/auth.md](./api/auth.md) for the full auth route list.
