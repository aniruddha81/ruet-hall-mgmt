# Backend documentation

Express + TypeScript API for **RUET Hall Management**. It powers the student web app and the admin panel.

## Start here

| Document | Description |
|----------|-------------|
| [Overview](./overview.md) | Purpose, modules, tech stack |
| [Getting started](./getting-started.md) | Install, env vars, run locally, database commands |
| [Architecture](./architecture.md) | MVC layout, middleware order, folder map |
| [Authentication](./authentication.md) | Redis sessions, cookies, roles, device limits |
| [Database](./database.md) | Drizzle ORM, migrations, schema summary |
| [Conventions](./conventions.md) | Naming, validation, errors, response format |
| [Integrations](./integrations.md) | Redis, PostgreSQL, Cloudinary, email, SSLCommerz |
| [Doc sync](./DOC_SYNC.md) | Keeping API docs aligned with code |

## API reference

Base path: `/api` (e.g. `http://localhost:8000/api/auth/login`).

| Module | Doc |
|--------|-----|
| Auth | [api/auth.md](./api/auth.md) |
| Profile | [api/profile.md](./api/profile.md) |
| Dining | [api/dining.md](./api/dining.md) |
| Admission | [api/admission.md](./api/admission.md) |
| Inventory | [api/inventory.md](./api/inventory.md) |
| Finance | [api/finance.md](./api/finance.md) |
| Notifications | [api/notifications.md](./api/notifications.md) |

## Other resources

- [ER diagram](../ER_DIAGRAM.txt) — entity relationships (keep in sync with `src/db/models/`)
- [Postman collection](../postman/collections/ruet-hall-mgmt-api/) — example requests
- [VM deployment runbook](../../VM_DEPLOYMENT_FROM_SCRATCH.md) — full-stack Docker deploy
- [Doc sync process](./DOC_SYNC.md) — how humans and agents keep docs current
- [Agent rules](../AGENTS.md) — mandatory LLM instructions for `backend/`
