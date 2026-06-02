# Payments API (SSLCommerz)

Prefix: `/api/payments`

Hosted checkout integration with [SSLCommerz](https://sslcommerz.com/integration-document/). Sandbox base URL: `https://sandbox.sslcommerz.com`.

## Callback routes (public, no session)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sslcommerz/ipn` | Instant Payment Notification (server-to-server) |
| `POST`, `GET` | `/sslcommerz/success` | Browser return after successful payment; validates and redirects to student app |
| `POST`, `GET` | `/sslcommerz/fail` | Browser return on failure |
| `POST`, `GET` | `/sslcommerz/cancel` | Browser return on cancel |

`POST` is the primary callback method as documented by SSLCommerz. `GET` is supported as a fallback for browser-driven redirects.

Success/fail/cancel handlers redirect to:

- **Web:** `STUDENT_URL/dashboard/payments?payment=success|failed|cancelled`
- **Mobile (`hall-app`):** optional `returnUrl` on pay/book requests (`hallapp://`, `exp://`, or `edu.ruet.hall://` from Expo Linking), stored on the payment intent — same query params appended so `openAuthSessionAsync` can close the in-app browser. Success callbacks are idempotent when IPN completes first; mobile callbacks still redirect to the app instead of returning JSON errors when possible.

## Initiation (via other modules)

SSLCommerz sessions are created from:

| Module | Route | When |
|--------|-------|------|
| Finance | `POST /api/finance/my-dues/pay/:id` | `method` = `ONLINE` — response includes `gatewayUrl`, `status: PENDING` |
| Dining | `POST /api/dining/book-tokens` | `paymentMethod` in `BKASH`, `NAGAD`, `ROCKET` |

Cash and bank-transfer flows stay synchronous on those routes.

## Persistence

Pending checkouts are stored in `payment_intents` (`tran_id`, `type`, `payload`, `status`). Completion runs the same business logic as immediate cash payments after SSLCommerz validation (`val_id`). Failed, cancelled, expired and unattempted callbacks are persisted as non-completed terminal statuses to avoid stale pending intents.

## Environment

See [getting-started.md](../getting-started.md) and [integrations.md](../integrations.md).
