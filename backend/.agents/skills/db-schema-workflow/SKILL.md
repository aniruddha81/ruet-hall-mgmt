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
   - `auth.models.ts` — users, refreshTokens, hallStudents, hallAdmins
   - `halls.models.ts` — halls, rooms
   - `dining.models.ts` — mealMenus, mealTokens, mealPayments
   - `admission.models.ts` — seatApplications, seatAllocations
   - `inventory.models.ts` — assets, damageReports
   - `finance.models.ts` — studentDues, payments, expenses
   - `notifications.models.ts` — notifications

2. **Edit the model** — Add or modify table/column definitions using Drizzle's `mysqlTable` helpers. Use enum types from `src/types/enums.ts` where applicable.

3. **Export from index** — Ensure `src/db/models/index.ts` exports the modified table.

4. **Generate and push migration:**
   ```bash
   cd backend
   npx drizzle-kit generate
   npx drizzle-kit push
   ```

5. **Update ER_DIAGRAM.txt** — Reflect the change in `backend/ER_DIAGRAM.txt`. Follow the existing crow's-foot notation format already used in the file.

6. **Update related types** — If adding new enum values, update `src/types/enums.ts`. If adding new columns, update any TypeScript types in `src/types/` that reference the table.

## Enum Safety

Check `src/types/enums.ts` before using any enum string. Enum values in the Drizzle model must match what is defined there exactly (e.g., `PROVOST`, `PENDING`, `APPROVED`).

## Completion Checks

- Model file uses `mysqlTable` (no raw SQL strings anywhere).
- `drizzle-kit generate` and `push` complete without errors.
- `ER_DIAGRAM.txt` updated to reflect new tables/columns/relations.
- Any TypeScript types or enum lists affected by the change are updated.
- Controllers that query the affected table still compile cleanly.
