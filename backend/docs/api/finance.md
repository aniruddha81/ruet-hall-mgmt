# Finance API

Prefix: `/api/finance`

Validators: `src/modules/finance/finance.validators.ts`

## Student (`STUDENT`)

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/my-dues` | List own unpaid/paid dues |
| `POST` | `/my-dues/pay/:id` | Pay a due; `multipart` `receiptImage` for `BANK`. `ONLINE` returns `{ gatewayUrl, status: PENDING }` for SSLCommerz redirect. Optional JSON `returnUrl` (`hallapp://` / `exp://`) for mobile deep-link return |
| `GET` | `/my-ledger` | Own payment / due history |

## Dues (staff)

Role: `ASST_FINANCE` (PROVOST allowed)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/dues` | Create due for a student |
| `PATCH` | `/dues/pay/:id` | Record payment (admin); optional receipt upload |

Receipt verification:

| Method | Path | Roles |
|--------|------|-------|
| `PATCH` | `/payments/:id/verify-receipt` | `ASST_FINANCE`, `FINANCE_SECTION_OFFICER` |

## Expenses

| Method | Path | Roles |
|--------|------|-------|
| `POST` | `/expense` | `ASST_FINANCE` — record hall expense |
| `GET` | `/expenses` | `ASST_FINANCE`, `FINANCE_SECTION_OFFICER` — list with filters |

## Ledgers (staff)

| Method | Path | Roles |
|--------|------|-------|
| `GET` | `/student/ledger/:id` | `ASST_FINANCE`, `FINANCE_SECTION_OFFICER` |

## Meal payments (dining revenue)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/meal-payments` | List meal payments |
| `GET` | `/meal-payments/report` | Aggregated report |
| `GET` | `/meal-payment/:id` | Single payment detail |
| `PATCH` | `/meal-payment/:id/verify-receipt` | Verify student dining receipt |

## Enums

- `DUE_TYPES`: `RENT`, `FINE`, `OTHER`
- `DUE_STATUSES`: `UNPAID`, `PAID`
- `FINANCE_PAYMENT_METHODS`: `CASH`, `BANK`, `ONLINE`

Dining module uses separate `PAYMENT_METHODS` (`BKASH`, `NAGAD`, …) on `meal_payments`.

## Tables

- `student_dues` — charges per student
- `payments` — payments linked to dues
- `expenses` — hall operational expenses
- `meal_payments` — dining module (cross-read here)

## Related

- Models: `src/db/models/finance.models.ts`
- Dining payments: [dining.md](./dining.md)
- Receipt template: `src/utils/receiptTemplate.ts`
