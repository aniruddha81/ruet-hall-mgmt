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

The Docker build uses `BACKEND_API_URL` at build time for Next.js rewrites. For VM deployment, use the root-level [`DEPLOYMENT.md`](../DEPLOYMENT.md) and `docker-compose.prod.yml`.
