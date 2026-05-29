# Payments API (SSLCommerz)

Prefix: `/api/payments`

Hosted checkout integration with [SSLCommerz](https://sslcommerz.com/integration-document/). Sandbox base URL: `https://sandbox.sslcommerz.com`.

## Callback routes (public, no session)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sslcommerz/ipn` | Instant Payment Notification (server-to-server) |
| `GET` | `/sslcommerz/success` | Browser return after successful payment; validates and redirects to student app |
| `GET` | `/sslcommerz/fail` | Browser return on failure |
| `GET` | `/sslcommerz/cancel` | Browser return on cancel |

Success/fail/cancel handlers redirect to `STUDENT_URL/dashboard/payments?payment=success|failed|cancelled`.

## Initiation (via other modules)

SSLCommerz sessions are created from:

| Module | Route | When |
|--------|-------|------|
| Finance | `POST /api/finance/my-dues/pay/:id` | `method` = `ONLINE` — response includes `gatewayUrl`, `status: PENDING` |
| Dining | `POST /api/dining/book-tokens` | `paymentMethod` in `BKASH`, `NAGAD`, `ROCKET` |

Cash and bank-transfer flows stay synchronous on those routes.

## Persistence

Pending checkouts are stored in `payment_intents` (`tran_id`, `type`, `payload`, `status`). Completion runs the same business logic as immediate cash payments after SSLCommerz validation (`val_id`).

## Environment

See [getting-started.md](../getting-started.md) and [integrations.md](../integrations.md).
