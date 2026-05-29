---
name: docs-sync-workflow
description: >-
  Keep backend Markdown documentation in sync with the codebase. Use after
  adding, changing, or removing API routes, auth behavior, environment variables,
  middleware, feature modules, integrations, or any change an LLM would need
  to discover from docs/. Run docs:manifest and docs:check. Replaces legacy
  PROJECT_DOCS.txt maintenance.
argument-hint: "What changed in the backend (routes, auth, schema, env, …)?"
---

# Docs Sync Workflow (Backend)

Use this skill whenever you modify `backend/` in a way that affects how the API or system works. **Documentation is not optional** — update `docs/` in the same task as the code change.

## Canonical docs tree

```
backend/docs/
  README.md              # Index (update if new top-level doc)
  overview.md            # Modules list, tech stack
  getting-started.md     # Env vars, npm scripts
  architecture.md        # MVC, middleware, src/ layout
  authentication.md      # Redis sessions, roles, cookies
  database.md            # Drizzle, models summary
  conventions.md         # ApiResponse, Zod, naming
  integrations.md        # Redis, Cloudinary, SMTP, pay service
  api/README.md          # API index
  api/<module>.md        # Per-module route tables
  .generated/            # Machine output — do not hand-edit
    api-manifest.json
```

Also update when relevant:

- `backend/ER_DIAGRAM.txt` — schema (prefer `db-schema-workflow` skill)
- `backend/README.md` — only if quick-start commands change
- `backend/AGENTS.md` — only if agent rules themselves change

**Do not** create `PROJECT_DOCS.txt` or duplicate long prose outside `docs/`.

## Workflow

### 1. Regenerate the API manifest

From `backend/`:

```bash
npm run docs:manifest
```

This writes `docs/.generated/api-manifest.json` from `src/app.ts` and all `*.routes.ts` / `*.route.ts` files. Treat it as the route inventory.

### 2. Map your change → doc files

| Code change | Doc file(s) |
|-------------|-------------|
| Route in `auth.routes.ts` | `docs/api/auth.md` |
| Route in `profile.route.ts` | `docs/api/profile.md` |
| Route in `dining.routes.ts` | `docs/api/dining.md` |
| Route in `admission.routes.ts` | `docs/api/admission.md` |
| Route in `inventory.routes.ts` | `docs/api/inventory.md` |
| Route in `finance.routes.ts` | `docs/api/finance.md` |
| Route in `notifications.routes.ts` | `docs/api/notifications.md` |
| New `app.use("/api/...")` mount | `docs/api/README.md`, `docs/overview.md`, `src/app.ts` |
| `authenticateToken` / sessions / cookies | `docs/authentication.md` |
| `src/types/enums.ts` roles or domain enums | `docs/authentication.md`, affected `docs/api/*.md` |
| `Constants.ts` or new `process.env` | `docs/getting-started.md`, `docs/integrations.md` |
| `src/lib/redis.ts`, `sessionStore.ts`, `cache.ts` | `docs/authentication.md`, `docs/integrations.md` |
| New model file or table | `docs/database.md` + `ER_DIAGRAM.txt` |
| Middleware order in `app.ts` | `docs/architecture.md` |

### 3. Update Markdown

For **API routes**, each `docs/api/<module>.md` should have a table row per route:

- HTTP method
- Path (relative to module prefix, e.g. `/login` not `/api/auth/login`)
- Roles / middleware (if non-obvious)
- Short description
- Note `multipart` fields when `upload.single(...)` is used

Match the style of existing tables in that file. Remove rows for deleted routes.

For **behavioral** changes (not just new paths), update prose in `authentication.md`, `architecture.md`, etc.

### 4. Verify

```bash
npm run docs:check
```

- Exit code `0` — every manifest route appears in the module’s API doc.
- Exit code `1` — fix missing paths or wrong module doc, then re-run.

### 5. Completion checks

- [ ] `npm run docs:manifest` run (if routes changed)
- [ ] `npm run docs:check` passes
- [ ] No references to `PROJECT_DOCS.txt` introduced
- [ ] Postman collection updated if the team relies on it (optional, same change set)

## Module → doc mapping

| Mount (`app.ts`) | Routes file | API doc |
|------------------|-------------|---------|
| `/api/auth` | `auth.routes.ts` | `api/auth.md` |
| `/api/profile` | `profile.route.ts` | `api/profile.md` |
| `/api/dining` | `dining.routes.ts` | `api/dining.md` |
| `/api/admission` | `admission.routes.ts` | `api/admission.md` |
| `/api/inventory` | `inventory.routes.ts` | `api/inventory.md` |
| `/api/finance` | `finance.routes.ts` | `api/finance.md` |
| `/api/notifications` | `notifications.routes.ts` | `api/notifications.md` |

## When the user only asks for code

Still run steps 1–4 if you touched routes, auth, env, or schema. Mention in the reply which doc files were updated.

## Related skills

- `db-schema-workflow` — schema + `ER_DIAGRAM.txt` + `docs/database.md`
- `secure-api-workflow` — auth/CORS; points here for doc updates after route changes
