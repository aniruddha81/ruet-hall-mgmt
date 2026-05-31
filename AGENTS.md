# Monorepo — agent instructions

## Backend API (`backend/`)

When editing the main API server:

1. Follow **`backend/AGENTS.md`**.
2. After route, auth, env, or schema changes, run **`docs-sync-workflow`** (`backend/.agents/skills/docs-sync-workflow/SKILL.md`):
   - Update `backend/docs/`
   - Update matching files in `backend/docs/` (see `backend/AGENTS.md`)

Cursor rule: `.cursor/rules/backend-docs-sync.mdc` (applies to `backend/**`).

## Other services

| Path | Notes |
|------|--------|
| `web/` | Student Next.js app — HeroUI |
| `hall-app/` | Student Expo SDK 56 mobile app — see `hall-app/AGENTS.md` |
| `hall-admin-app/` | Admin Expo SDK 56 mobile app — see `hall-admin-app/AGENTS.md` |
| `admin/` | Admin Next.js app — Radix UI |
| `pay/` | Removed — SSLCommerz runs in `backend/` |

## Project-wide context

- `LLM_CONTEXT.md` — architecture overview
- `ENV_AND_RUN.md` — single root `.env` and dev/production run guide
- `.agents/skills/project-context/SKILL.md` — quick reference skill
