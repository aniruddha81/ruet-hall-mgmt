# API reference

## Base URL

```text
http://localhost:<PORT>/api
```

Default `PORT`: `8000`.

## Common behavior

### Authentication

Most routes require a valid session:

- **Cookie:** `sessionId` (httpOnly, set on login)
- **Header:** `Authorization: Bearer <sessionId>`

See [Authentication](../authentication.md).

### Response envelope

```json
{
  "statusCode": 200,
  "success": true,
  "data": {},
  "message": "Human-readable message"
}
```

### Errors

HTTP status matches `statusCode` in body. Typical codes: `400` validation, `401` auth, `403` forbidden, `404` not found, `429` rate limit, `503` Redis unavailable.

### Multipart

Some routes expect `multipart/form-data` (receipt or image field documented per endpoint). Others use `application/json`.

## Modules

| Prefix | Documentation |
|--------|----------------|
| `/api/auth` | [auth.md](./auth.md) |
| `/api/profile` | [profile.md](./profile.md) |
| `/api/dining` | [dining.md](./dining.md) |
| `/api/admission` | [admission.md](./admission.md) |
| `/api/inventory` | [inventory.md](./inventory.md) |
| `/api/finance` | [finance.md](./finance.md) |
| `/api/notifications` | [notifications.md](./notifications.md) |
| `/api/payments` | [payments.md](./payments.md) |

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | No | API welcome message |
