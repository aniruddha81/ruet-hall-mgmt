# Payment Server

Mock payment service for the RUET Hall Management workspace.

## Purpose

- simulate meal and hall-charge payment endpoints
- return generated transaction IDs for backend integration
- stay internal-only in the VM deployment stack

## Local run

```bash
npm install
npm run dev
```

## Docker

Use the local project compose file when you want to run just this service:

```bash
docker compose up --build
```

If it needs to talk to a backend running on your host machine, set `MAIN_SERVER_URL` or rely on the default `http://host.docker.internal:8000` from `docker-compose.yml`.
