# Dining API

Prefix: `/api/dining`

Validators: `src/modules/dining/dining.validators.ts`

Meal tokens are **prepaid**: students book for **tomorrow**, pay with receipt upload, managers track consumption and refunds.

## Student (`STUDENT`)

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/tomorrow-menus` | Menus for student's hall |
| `POST` | `/book-tokens` | `multipart`: `receiptImage` + validated body |
| `GET` | `/my-active-tokens` | Tokens cancellable before cutoff |
| `PATCH` | `/cancel-token/:tokenId` | Cancel before midnight rule |
| `GET` | `/token-history` | Paginated history; query validated |
| `GET` | `/token/:tokenId` | Single token detail |

## Dining manager (`DINING_MANAGER`, `ASST_DINING`)

### Menus

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/menu/create` | Create tomorrow's menu |
| `PATCH` | `/menu/:menuId/update` | Update menu |
| `DELETE` | `/menu/:menuId` | Delete if no bookings |
| `GET` | `/menus/tomorrow` | List tomorrow's menus |
| `GET` | `/menus/today` | Today's menus (consumption) |

### Meal items (catalog)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/meal-items` | List meal item master data |
| `POST` | `/meal-items` | Create item |
| `PATCH` | `/meal-items/:itemId` | Update item |
| `DELETE` | `/meal-items/:itemId` | Delete item |

### Bookings & service

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/bookings/menu/:menuId` | All bookings for a menu |
| `GET` | `/bookings/tomorrow` | Tomorrow's active bookings |
| `PATCH` | `/tokens/mark-consumed` | Mark tokens consumed at service |

### Reports

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/report/daily` | Daily consumption report |
| `GET` | `/report/range` | Date-range sales report |
| `GET` | `/report/monthly` | Monthly summary |

## Payments (student + dining staff)

| Method | Path | Roles |
|--------|------|-------|
| `GET` | `/payment/:paymentId` | `STUDENT`, `DINING_MANAGER`, `ASST_DINING` |
| `POST` | `/payment/:paymentId/refund` | Same — refund cancelled tokens |

Finance staff verify receipts via [finance.md](./finance.md) (`/meal-payment/:id/verify-receipt`).

## Domain notes

- `MEAL_TYPES`: `LUNCH`, `DINNER`
- `TOKEN_STATUSES`: `ACTIVE`, `CANCELLED`, `CONSUMED`
- Menus link to `meal_items` through `meal_menu_items`
- `available_tokens` derived from capacity minus bookings

## Related

- Models: `src/db/models/dining.models.ts`
- Postman: `postman/.../Dining/`
