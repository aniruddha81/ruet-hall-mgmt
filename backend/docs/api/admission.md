# Admission API

Prefix: `/api/admission`

Validators: `src/modules/admission/admission.validators.ts`

Seat application workflow: student apply (no hall) → DSW review → seat charge → payment → DSW allocate room in a hall with availability.

## Student (`STUDENT`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/apply` | Submit seat application (department + session only) |
| `GET` | `/my-status` | Own application status |

## DSW (`DSW` only — `authorizeExactRoles`, no PROVOST bypass)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/applications` | List all applications (optional status filter) |
| `GET` | `/available-rooms` | Rooms with free capacity; only halls with availability |
| `PATCH` | `/review/:id/` | Approve or reject application |
| `POST` | `/applications/:id/seat-charge` | Create seat charge (`amount`, `hall`) after approval |
| `POST` | `/allocate` | Assign room after student pays charge |

## Status values

`SEAT_APPLICATION_STATUSES`: `PENDING`, `APPROVED`, `REJECTED`

## Data model

- `seat_applications` — application per student/session; `hall` nullable until charge or allocation
- `seat_allocations` — final room assignment; updates `uni_students.room_id` / `is_allocated`

## Seed

Single DSW account: `dsw@ruet.ac.bd` (see `src/db/seed.ts`).

## Related

- Models: `src/db/models/admission.models.ts`
- Finance: seat charges create student dues ([finance.md](./finance.md))
