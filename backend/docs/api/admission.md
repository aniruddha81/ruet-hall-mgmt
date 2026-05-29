# Admission API

Prefix: `/api/admission`

Validators: `src/modules/admission/admission.validators.ts`

Seat application workflow: apply → staff review → seat charge → payment → allocate room.

## Student (`STUDENT`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/apply` | Submit seat application for a hall |
| `GET` | `/my-status` | Own application status |

## Inventory staff (`ASST_INVENTORY`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/applications` | List applications (filters in query schema) |
| `PATCH` | `/review/:id/` | Approve or reject application |
| `POST` | `/applications/:id/seat-charge` | Create seat allocation due after approval |
| `POST` | `/allocate` | Assign room after student pays charge |

## Status values

`SEAT_APPLICATION_STATUSES`: `PENDING`, `APPROVED`, `REJECTED`

## Data model

- `seat_applications` — application per student/hall/session
- `seat_allocations` — final room assignment; updates `uni_students.room_id` / `is_allocated`

`PROVOST` can access any route guarded with `authorizeRoles("ASST_INVENTORY")`.

## Related

- Models: `src/db/models/admission.models.ts`
- Finance: seat charges create student dues ([finance.md](./finance.md))
