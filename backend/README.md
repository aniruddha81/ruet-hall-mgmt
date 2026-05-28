# RUET Hall Management Backend

Main Express + Drizzle API for the RUET Hall Management system.

## Start Here

Before making structural backend changes, read [`PROJECT_DOCS.txt`](./PROJECT_DOCS.txt).

## Development

```bash
npm install
npm run dev
```

API URL: `http://localhost:8000`

## Database

Use the local backend compose file for backend + MySQL, or the root-level compose files for the full stack.

```bash
docker compose up --build
```

## Deployment

For single-VM deployment, use the root-level runbook:

- [`VM_DEPLOYMENT_FROM_SCRATCH.md`](../VM_DEPLOYMENT_FROM_SCRATCH.md)

This repo deploys with the root-level `docker-compose.yml`.
