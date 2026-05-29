# Profile API

Prefix: `/api/profile`

All routes require `authenticateToken` and `authorizeRoles(...ROLES)` (all roles).

Validators: `src/modules/profile/profile.validators.ts`

| Method | Path | Body / upload | Description |
|--------|------|---------------|-------------|
| `GET` | `/me` | — | Current user profile (student or admin) |
| `PATCH` | `/update` | JSON — `updateProfileSchema` | Update name, phone, etc. |
| `PATCH` | `/change-password` | JSON — `changePasswordSchema` | Change password (revokes other sessions on success) |
| `POST` | `/upload-image` | `multipart` field `avatar` | Upload avatar to Cloudinary |

## Side effects

- Profile updates may call `invalidateAuthAccountCache` in Redis.
- Password change may call `revokeAllUserSessions` except current session (see controller).

## Related

- [Integrations](../integrations.md) — Cloudinary
