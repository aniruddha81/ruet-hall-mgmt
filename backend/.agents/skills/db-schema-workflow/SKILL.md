---
name: db-schema-workflow
description: >-
  Manage database schema changes for the backend using Drizzle ORM. Use when
  adding, modifying, or removing tables, columns, enums, or relations; when
  the user asks about migrations, schema updates, or model changes; or whenever
  ER_DIAGRAM.txt needs to be kept in sync with the codebase.
argument-hint: "Which table or schema change needs to be made?"
---

# DB Schema Workflow (Drizzle ORM)

Use this skill for any schema modification in the `backend` service.

## Source of Truth

All schema lives in `backend/src/db/models/*.ts`. Never write or run raw SQL migrations. The ER diagram at `backend/ER_DIAGRAM.txt` must stay in sync with the models.

## Workflow

1. **Identify the right model file** — each domain has its own file:
   - `auth.models.ts` — uni_students, hall_admins, academic_sessions
   - `halls.models.ts` — halls, rooms
   - `dining.models.ts` — mealMenus, mealTokens, mealPayments
   - `admission.models.ts` — seatApplications, seatAllocations
   - `inventory.models.ts` — damage_reports (and related inventory tables)
   - `finance.models.ts` — studentDues, payments, expenses
   - `notifications.models.ts` — notifications

2. **Edit the model** — Add or modify table/column definitions using Drizzle's `pgTable` / `pgEnum` helpers (`drizzle-orm/pg-core`). Export each `pgEnum` as `*SQL_Enum` (e.g. `hallSQL_Enum`) so names do not clash with `src/types/enums.ts`. Use enum values from `src/types/enums.ts` where applicable.

3. **Export from index** — Ensure `src/db/models/index.ts` exports the modified table.

4. **Generate and commit migrations (production uses `db:migrate`, not push):**
   ```bash
   cd backend
   npm run db:generate
   # Review SQL in drizzle/*.sql — must be incremental on existing DBs, not full CREATE TABLE baselines
   git add drizzle/
   ```
   Local quick sync only: `npm run db` (`drizzle-kit push`). Do **not** rely on push for VM deploys.

5. **Update ER_DIAGRAM.txt** — Reflect the change in `backend/ER_DIAGRAM.txt`. Follow the existing crow's-foot notation format already used in the file.

6. **Update related types** — If adding new enum values, update `src/types/enums.ts`. If adding new columns, update any TypeScript types in `src/types/` that reference the table.

7. **Update docs** — Edit `backend/docs/database.md` for table/column summaries. Run `docs-sync-workflow` if enums affect API docs.

## Enum Safety

Check `src/types/enums.ts` before using any enum string. Enum values in the Drizzle model must match what is defined there exactly (e.g., `PROVOST`, `PENDING`, `APPROVED`).

## Completion Checks

- Model file uses `pgTable` / `pgEnum` exported as `*SQL_Enum` (no raw SQL strings anywhere).
- `drizzle-kit generate` and `push` complete without errors.
- `ER_DIAGRAM.txt` updated to reflect new tables/columns/relations.
- Any TypeScript types or enum lists affected by the change are updated.
- Controllers that query the affected table still compile cleanly.
