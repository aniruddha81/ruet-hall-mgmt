# Database

## Stack

- **MySQL** — primary persistence
- **Drizzle ORM** — schema-as-code in `src/db/models/`
- **drizzle-kit** — migrations under `backend/drizzle/`

Connection: `DATABASE_URL` → `src/db/index.ts`:

```typescript
export const db = drizzle(process.env.DATABASE_URL);
```

Config: `drizzle.config.ts` (dialect `mysql`, schema `./src/db/models/index.ts`).

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
- **MySQL enums** in models: `mysqlEnum("column_name", VALUES)` — local names like `mealTypeSQL_Enum`; not exported from model files.
- **Explicit defaults on insert** — do not rely on Drizzle `.default()` alone if MySQL has no column default; pass `status`, enums, etc. in `.insert()` to avoid constraint errors.

## Redis vs MySQL

| Data | Store |
|------|--------|
| Accounts, applications, menus, dues, … | MySQL |
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
