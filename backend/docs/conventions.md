# Coding conventions

## Naming

| Artifact | Pattern | Example |
|----------|---------|---------|
| Controller | `<module>.controller.ts` | `dining.controller.ts` |
| Routes | `<module>.routes.ts` | `finance.routes.ts` |
| Validators | `<module>.validators.ts` | `auth.validators.ts` |
| Models | `<domain>.models.ts` | `admission.models.ts` |
| Handlers | `camelCase` exports | `export const bookMealTokens = async (...)` |
| SQL enum in model | `<field>SQL_Enum` | `mealTypeSQL_Enum` |

## TypeScript enums

Domain values are `as const` arrays in `src/types/enums.ts`:

```typescript
export const HALLS = ["ZIA_HALL", "SELIM_HALL", ...] as const;
export type Hall = (typeof HALLS)[number];
```

Import these in validators with `z.enum(HALLS)` (or equivalent Zod 4 API).

## API responses

Success — always wrap with `ApiResponse`:

```typescript
res.status(200).json(
  new ApiResponse(200, { items, pagination }, "Items retrieved successfully")
);
```

Shape:

```json
{
  "statusCode": 200,
  "data": { },
  "message": "Success",
  "success": true
}
```

## Errors

Throw `ApiError`:

```typescript
throw new ApiError(404, "User not found");
throw new ApiError(400, "Validation failed", zodIssuesArray);
```

Global handler (`errorHandling.middleware.ts`) returns:

```json
{
  "success": false,
  "data": null,
  "message": "...",
  "errors": [],
  "stack": "..." 
}
```

`stack` is included only when `NODE_ENV === "development"`.

## Validation

Schemas live in `*.validators.ts`:

```typescript
export const createDueSchema = {
  body: z.object({
    studentId: z.string().uuid(),
    hall: z.enum(HALLS),
    type: z.enum(DUE_TYPES),
    amount: z.number().int().positive(),
  }),
};
```

`validateRequest(schema)` validates `body`, `params`, `query`, `headers`, or `cookies` and **replaces** `req.body` / `req.params` / `req.query` with parsed values (via `Object.defineProperty` because Express types them readonly).

## Controllers

- Use `async`/`await`; no `.then()` chains.
- No raw `res.json({ foo })` for success — use `ApiResponse`.
- Prefer throwing `ApiError` over generic `Error`.
- Keep Drizzle queries in controllers unless shared across handlers (then use service).

## Security checklist

- Protected routes: `authenticateToken` + `authorizeRoles` as needed.
- Never return `passwordHash` in JSON.
- Opaque session ids only in httpOnly cookies (or Bearer for tools).
- Validate all inputs with Zod.
- File uploads: `multer` limits + Cloudinary; role-gated routes.

## Formatting

Prettier config: `backend/.prettierrc`. Use `const`/`let`, arrow functions unless `this` is required.

## Secure API changes

For auth/CORS/validation work, see `backend/.agents/skills/secure-api-workflow/SKILL.md`.
