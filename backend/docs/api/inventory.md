# Inventory API

Prefix: `/api/inventory`

Validators: `src/modules/inventory/inventory.validators.ts`

Focus: **room listing** and **damage reports** (asset tables are not exposed as separate CRUD in current routes).

## Room management

Roles: `ASST_INVENTORY`, `INVENTORY_SECTION_OFFICER`  
(`PROVOST` also allowed)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/rooms` | List rooms; filters via query schema (hall, status, …) |

## Damage reports

### Student (`STUDENT`)

| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/damage` | `multipart` field `image` + body schema |

### Inventory staff

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/damage` | List reports (filters) |
| `PATCH` | `/damage/:id/verify` | Verify report, set fine / liability |
| `PATCH` | `/damage/verify/:id` | Alias of verify (backward compatible) |
| `PATCH` | `/damage/:id/fix` | Mark damage as fixed |

## Status values

`DAMAGE_REPORT_STATUSES`: `REPORTED`, `VERIFIED`, `FIXED`

Verified fines may create finance dues (`FINE` type) through finance module workflows.

## Related

- Models: `src/db/models/inventory.models.ts`, `halls.models.ts`
- Uploads: [Integrations](../integrations.md)
