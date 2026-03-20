---
name: secure-api-workflow
description: "Harden pay service APIs. Use for payload validation, CORS tightening, robust transaction ID handling, safe response contracts, and defensive updates to payment simulation endpoints."
argument-hint: "Which payment endpoint should be secured?"
---

# Secure API Workflow (Payment Service)

Use this skill for `pay` service endpoint changes.

## Security Baseline (Balanced Strictness)

- Mandatory: input validation, contract stability, CORS review, centralized error handling.
- Recommended when relevant: idempotency strategy and abuse controls.

## Workflow

1. Confirm contract dependencies with consuming backend.
2. Validate and normalize payload shapes (`req.body` vs `req.body.params`).
3. Generate transaction IDs with stable prefixes and low collision risk.
4. Tighten CORS for non-local deployments.
5. Keep success/error envelopes consistent and non-leaky.
6. Validate via `npm run build` and `npm run health-check`.

## Completion Checks

- Invalid payloads are rejected clearly.
- Response shape remains predictable.
- Security settings are intentional, not permissive by default.
- Build and health-check pass.
