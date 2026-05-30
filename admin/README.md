# RUET Hall Management Admin Web

Admin-facing Next.js application for the RUET Hall Management system.

## Development

```bash
npm install
npm run dev
```

App URL: `http://localhost:4001`

## Docker

```bash
docker compose up --build
```

Env and rewrites use the repo root [`.env`](../.env). For VM deployment see [ENV_AND_RUN.md](../ENV_AND_RUN.md) and [VM_DEPLOYMENT_FROM_SCRATCH.md](../VM_DEPLOYMENT_FROM_SCRATCH.md) (`docker-compose.yml` at repo root).
