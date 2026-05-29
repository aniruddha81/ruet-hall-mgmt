# Keeping documentation in sync

Backend docs are **Markdown in `docs/`**, maintained alongside code changes.

## For humans

1. Change code.
2. Update the relevant `docs/**/*.md` files (see table in [AGENTS.md](../AGENTS.md)).
3. Run from `backend/`:

```bash
npm run docs:manifest   # refresh route inventory
npm run docs:check      # fail if API docs omit a route
```

## For AI / Cursor agents

- Read **[`AGENTS.md`](../AGENTS.md)** at the start of backend tasks.
- Apply skill **`docs-sync-workflow`** (`.agents/skills/docs-sync-workflow/SKILL.md`) after route, auth, env, or schema changes.
- Always run `docs:check` before marking the task done.

## What was removed

`PROJECT_DOCS.txt` was deleted (out of date, duplicated `docs/`). Use `docs/` only.

## CI (optional)

Add to your pipeline:

```bash
cd backend && npm run docs:manifest && npm run docs:check
```

Commit `docs/.generated/api-manifest.json` when routes change so PRs show doc drift.
