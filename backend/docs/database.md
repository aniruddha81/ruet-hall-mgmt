# Database

## Stack

- **PostgreSQL 18** — primary persistence (Docker: `postgres:18.4-alpine` in root compose files)
- **Drizzle ORM** — schema-as-code in `src/db/models/`
- **drizzle-kit** — migrations under `backend/drizzle/`

### Docker (compose)

| File | Container | Image | External port |
|------|-----------|-------|-----------------|
| `docker-compose.local.yml` | `hallmgmt-postgres-local` | `postgres:18.4-alpine` | `127.0.0.1:5433` |
| `docker-compose.yml` | `hallmgmt-postgres` | `postgres:18.4-alpine` | `127.0.0.1:5432` |

Env: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (root `.env`). Backend receives `DATABASE_URL=postgresql://…@postgres:5432/…` on the internal network.

Connection: `DATABASE_URL` → `src/db/index.ts` (`drizzle-orm/node-postgres` + `pg`):

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./models/index.ts";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

Config: `drizzle.config.ts` uses `defineConfig` from `drizzle-kit` (dialect `postgresql`, schema `./src/db/models/index.ts`).

## Workflow

| Command | When to use |
|---------|-------------|
| `npm run db:generate` | After changing models; produces SQL in `drizzle/migrations/` — **commit these** |
| `npm run db:migrate` | Apply committed migrations (CI / production) |
| `npm run db` | Push schema without migration files (local dev only) |
| `npm run db-all` | **Local only**: force push + run `seed.ts` |

Agent skill for schema changes: `backend/.agents/skills/db-schema-workflow/SKILL.md`.

Keep [`ER_DIAGRAM.txt`](../ER_DIAGRAM.txt) in sync when tables or relationships change.

## Model files

| File | Tables / domain |
|------|-----------------|
| `auth.models.ts` | `uni_students`, `hall_admins`, `academic_sessions` |
| `halls.models.ts` | `halls`, `rooms` |
| `dining.models.ts` | `meal_menus`, `meal_items`, `meal_menu_items`, `meal_tokens`, `meal_payments` |
| `admission.models.ts` | `seat_applications`, `seat_allocations` |
| `inventory.models.ts` | `damage_reports` (room/asset damage workflow) |
| `finance.models.ts` | `student_dues`, `payments`, `expenses` |
| `notifications.models.ts` | `notifications`, `notification_reads` |

All models are re-exported from `src/db/models/index.ts`.

## Schema conventions

- Primary keys: `varchar` UUIDs (`randomUUID()` in app code).
- **TypeScript enums** live in `src/types/enums.ts` (`HALLS`, `ROLES`, …).
- **PostgreSQL enums** in models: `pgEnum("type_name", VALUES)` exported as `*SQL_Enum` (e.g. `seatApplicationStatusSQL_Enum`) to avoid clashing with `src/types/enums.ts`; use `seatApplicationStatusSQL_Enum("status")` on columns.
- **Explicit defaults on insert** — pass `status`, enums, etc. in `.insert()` when app logic requires known values at insert time.

## Redis vs PostgreSQL

| Data | Store |
|------|--------|
| Accounts, applications, menus, dues, … | PostgreSQL |
| Live login sessions | Redis only |
| 30s account cache, 5min active academic sessions list | Redis (optional if down) |

## Core relationships (summary)

```text
halls.name ← rooms.hall
halls.name ← uni_students.hall, hall_admins.hall
rooms.id ← uni_students.room_id (when allocated)

uni_students ← seat_applications, seat_allocations, meal_tokens, student_dues, damage_reports
hall_admins ← reviews, allocations, expenses.approved_by, notifications

meal_menus ← meal_menu_items → meal_items
meal_tokens → meal_payments
student_dues ← payments
```

Full diagram: [ER_DIAGRAM.txt](../ER_DIAGRAM.txt).

## Seeding

`src/db/seed.ts` populates halls, rooms, sample users, and related dev data. Run via `npm run db-all` or invoke after migrations in local setups.

## Query patterns

Controllers use Drizzle query builder:

```typescript
const [row] = await db
  .select()
  .from(uniStudents)
  .where(eq(uniStudents.id, userId))
  .limit(1);

if (!row) throw new ApiError(404, "Not found");
```

Use `and()`, `or()`, `sql` template for filters and ordering. See [Conventions](./conventions.md).
