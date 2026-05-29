# Auth API

Prefix: `/api/auth`

Validators: `src/modules/auth/auth.validators.ts`

## Public — student

| Method | Path | Middleware | Description |
|--------|------|------------|-------------|
| `POST` | `/register` | Rate limit, `validateRequest(studentRegisterSchema)` | Create student account |
| `POST` | `/login` | `validateRequest(studentLoginSchema)` | Login; sets `sessionId` cookie |
| `GET` | `/sessions` | — | Active academic sessions (signup dropdown; Redis-cached) |

## Public — admin

| Method | Path | Middleware | Description |
|--------|------|------------|-------------|
| `POST` | `/admin/register` | Rate limit, `validateRequest(adminRegisterSchema)` | Admin application (pending approval) |
| `POST` | `/admin/login` | `validateRequest(adminLoginSchema)` | Admin login; sets cookie |

## Admin approval (PROVOST only)

`authorizeRoles()` with no roles → only `PROVOST`.

| Method | Path | Description |
|--------|------|-------------|
| `PATCH` | `/admin/approve` | Approve or reject pending admin |
| `GET` | `/admin/approve` | List pending admin applications |

## Academic sessions (staff)

Roles: `PROVOST`, `ASST_FINANCE`, `FINANCE_SECTION_OFFICER`, `ASST_INVENTORY`, `INVENTORY_SECTION_OFFICER`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/sessions/manage` | List all academic sessions |
| `POST` | `/sessions` | Create session |
| `PATCH` | `/sessions/:sessionId` | Update session (e.g. active flag) |

## Session management (authenticated)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/logout` | Revoke current device session |
| `POST` | `/logout-all` | Revoke all sessions for user |
| `GET` | `/devices` | List active live sessions |
| `DELETE` | `/devices/:sessionId` | Revoke a specific session |

## Rate limiting

Registration endpoints: **5 attempts / IP / 15 minutes** → `429`.

## Related

- [Authentication](../authentication.md)
- Session helpers: `src/lib/sessionStore.ts`, `src/modules/auth/auth.service.ts`
