---
name: project-context
description: >-
  Architectural reference for the RUET Hall Management System monorepo. Use
  when working on any part of the system to understand module boundaries, tech
  stacks, database structure, coding conventions, and critical agent rules.
  Covers web, admin, backend, and pay services.
---

# RUET Hall Management System — Project Context

Full reference lives in `LLM_CONTEXT.md` at the repo root. Read it first for detailed architecture. This skill summarizes the most critical conventions and quick-reference info.

## Monorepo Services

| Service | Role | Port | Stack |
|---------|------|------|-------|
| `web/` | Student portal | 3001 | Next.js (App Router), React 19, HeroUI, Tailwind v4 |
| `admin/` | Admin back-office | 4001 | Next.js (App Router), React 19, Radix UI, Tailwind v4 |
| `backend/` | Main API server | 8000 | Express 5.2+, Drizzle ORM, MySQL 8, Zod, TypeScript/tsx |
| `pay/` | Payment microservice | 8080 | Express 5.2+, TypeScript/tsx |

## Backend Module Layout

```
src/modules/<feature>/
  <feature>.routes.ts      # HTTP method → controller + middlewares
  <feature>.controller.ts  # Business logic (Drizzle queries only, no raw SQL)
  <feature>.validators.ts  # Zod schemas for body/params/query
  <feature>.service.ts     # (optional) extracted service logic
src/db/models/             # Drizzle table definitions (source of truth for schema)
src/utils/ApiError.ts      # throw new ApiError(status, message)
src/utils/ApiResponse.ts   # Wrap all responses in ApiResponse
src/types/enums.ts         # Enum values for roles, statuses, halls
```

Active modules: `auth`, `halls`, `dining`, `admission`, `inventory`, `finance`, `notifications`, `profile`.

## Auth Roles (from enums.ts)

`PROVOST`, `STUDENT`, `ASST_FINANCE`, `FINANCE_SECTION_OFFICER`, `ASST_DINING`, `DINING_MANAGER`, `ASST_INVENTORY`, `INVENTORY_SECTION_OFFICER`

## Backend Key Rules

1. **No raw SQL ever.** Schema changes go in `src/db/models/*.ts`, then run `npx drizzle-kit generate && npx drizzle-kit push` inside `backend/`.
2. **No try/catch.** Express 5 handles async errors; throw `new ApiError(status, message)` directly.
3. **Validation first.** Define Zod schema in `validators.ts` → bind with `validateRequest(schema)` on the route → controller receives fully validated `req.body`.
4. **Enum safety.** Always check `src/types/enums.ts` or model definitions before using role/status/hall enum strings.
5. **ER Diagram.** After any schema change, update `backend/ER_DIAGRAM.txt` to reflect the new state.

## UI Library Boundaries

- `web/` → **HeroUI** (`@heroui/react`) as primary; Radix UI only for primitives not covered by HeroUI.
- `admin/` → **Radix UI** (`@radix-ui/react-*`) + `lucide-react` + Tailwind CSS v4; no HeroUI.

## Infrastructure

- Containerized via Docker Compose (`docker-compose.local.yml` for local dev).
- Nginx reverse proxy for production (`docker-compose.yml`).
- Internal network `hallnet`: frontends → `backend:8000`, backend → `pay:8080`.
- Local DB: MySQL on `3307` externally, `3306` internally.

## Key Reference Files

- `LLM_CONTEXT.md` — full project architecture and all agent rules
- `backend/PROJECT_DOCS.txt` — detailed backend conventions, schema overview, API structure
- `backend/ER_DIAGRAM.txt` — live entity-relationship diagram (keep in sync with models)
