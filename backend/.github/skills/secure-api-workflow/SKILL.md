---
name: secure-api-workflow
description: "Implement secure API changes in the backend service. Use for auth, role authorization, schema validation, secure cookie handling, CORS hardening, and safe endpoint evolution under existing module conventions."
argument-hint: "Which endpoint or module needs a secure change?"
---

# Secure API Workflow (Main Backend)

Use this skill for `backend` service security-sensitive changes.

## Security Baseline (Balanced Strictness)

- Mandatory: request validation, authentication/authorization, explicit error paths, secure cookie/CORS review.
- Recommended when relevant: rate limiting and audit logging.

## Workflow

1. Read `PROJECT_DOCS.txt` for module and route conventions.
2. Define trust boundaries for body/query/params/cookies/headers.
3. Add or update route with:
   - `validateRequest(...)`
   - `authenticateToken` and `authorizeRoles(...)` where applicable
4. Keep controller logic fail-closed with consistent `ApiError` and `ApiResponse` use.
5. Verify hall/resource ownership checks for protected resources.
6. Review CORS and cookie security behavior for target environment.
7. Validate with running server (`npm run dev`) and postman collection checks.

## Completion Checks

- New/changed routes have explicit validation and auth decisions.
- No permissive auth fallback paths.
- Error responses are controlled and non-leaky.
- Success and abuse-path tests are both covered.
