# Notifications API

Prefix: `/api/notifications`

Validators: `src/modules/notifications/notifications.validators.ts`

In-app announcements with per-user read tracking.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/` | Yes | Create notification (validated body; creator from session) |
| `GET` | `/my` | Yes | Paginated notifications for current user |
| `PATCH` | `/:notificationId/read` | Yes | Mark one notification as read |

There is no `authorizeRoles` on these routes — any authenticated user may call them; business rules in the controller restrict who can create or which audience receives items.

## Data model

- `notifications` — `title`, `message`, `target_audience` (`STUDENT` | `ADMIN`), `created_by_admin_id`
- `notification_reads` — `reader_id`, `reader_role`, `read_at`

## Related

- Models: `src/db/models/notifications.models.ts`
- Service: `src/modules/notifications/notifications.service.ts`
