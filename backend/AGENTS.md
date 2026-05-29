# Backend — agent instructions

Instructions for AI agents working in `backend/`. Follow on every change that touches routes, auth, schema, env, or integrations.

## Documentation (required)

Human docs live in **`docs/`** (Markdown). There is no other backend architecture doc — do not recreate `PROJECT_DOCS.txt`.

| Change type | Update |
|-------------|--------|
| New/changed/removed route | Matching `docs/api/<module>.md` |
| Auth, sessions, roles, cookies | `docs/authentication.md` |
| New env variable | `docs/getting-started.md`, `docs/integrations.md` if external service |
| Schema / tables / enums | `docs/database.md`, `ER_DIAGRAM.txt` — use skill `db-schema-workflow` |
| Middleware, folder layout, app bootstrap | `docs/architecture.md` |
| New feature module | `docs/overview.md`, `docs/api/README.md`, mount in `src/app.ts` |

**After any backend PR-sized change:** ensure `docs/api/*.md` matches the routes you changed.

**Skill:** `.agents/skills/docs-sync-workflow/SKILL.md` — full checklist.

## Code rules (short)

1. Drizzle only — no raw SQL; schema in `src/db/models/*.ts`.
2. Throw `ApiError`; success responses use `ApiResponse`.
3. Zod in `*.validators.ts` + `validateRequest` on routes.
4. Roles/statuses/halls from `src/types/enums.ts`.
5. Protected routes: `authenticateToken` + `authorizeRoles` as needed.

## Skills

| Skill | When |
|-------|------|
| `docs-sync-workflow` | Any change that should be reflected in `docs/` |
| `db-schema-workflow` | Model / migration / ER diagram |
| `secure-api-workflow` | Auth, CORS, cookies, new sensitive endpoints |

## Source of truth

| Concern | Location |
|---------|----------|
| HTTP routes | `src/modules/**/*.routes.ts`, `src/modules/**/*.route.ts`, `src/app.ts` |
| DB schema | `src/db/models/*.ts` |
| Enums | `src/types/enums.ts` |
