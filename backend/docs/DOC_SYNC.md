# Keeping documentation in sync

Backend docs are **Markdown in `docs/`**, maintained alongside code changes.

## For humans

1. Change code.
2. Update the relevant `docs/**/*.md` files (see table in [AGENTS.md](../AGENTS.md)).
3. For routes, verify each path in `src/modules/**/*.routes.ts` appears in the matching `docs/api/<module>.md`.

## For AI / Cursor agents

- Read **[`AGENTS.md`](../AGENTS.md)** at the start of backend tasks.
- Apply skill **`docs-sync-workflow`** (`.agents/skills/docs-sync-workflow/SKILL.md`) after route, auth, env, or schema changes.

## What was removed

`PROJECT_DOCS.txt` was deleted (out of date, duplicated `docs/`). Use `docs/` only.

The former `docs:manifest` / `docs:check` npm scripts (route inventory JSON + automated doc diff) were removed; keep API docs in sync manually when you change routes.
