# RUET Hall Management

Student hall operations: student portal (`web`), admin portal (`admin`), and API (`backend`).

## Environment

One file: **`.env` at the repo root** (see [`.env.example`](.env.example)). All apps and Docker Compose read it. Details: [ENV_AND_RUN.md](ENV_AND_RUN.md).

## Run locally

**Prerequisites:** Node.js, PostgreSQL 18+, Redis Cloud (`REDIS_URL` in `.env`).

```bash
cp .env.example .env
# edit .env
```

First-time database:

```bash
cd backend
npm install
npm run db-all
```

Start (three terminals):

```bash
cd backend && npm run dev    # http://localhost:8000
cd web && npm install && npm run dev      # http://localhost:3001
cd admin && npm install && npm run dev    # http://localhost:4001
```

## Production

Copy the same `.env` to the VM and follow [VM_DEPLOYMENT_FROM_SCRATCH.md](VM_DEPLOYMENT_FROM_SCRATCH.md).

## More documentation

| Topic | Doc |
|-------|-----|
| Env variables | [ENV_AND_RUN.md](ENV_AND_RUN.md) |
| VM deploy | [VM_DEPLOYMENT_FROM_SCRATCH.md](VM_DEPLOYMENT_FROM_SCRATCH.md) |
| Backend API | [backend/docs/getting-started.md](backend/docs/getting-started.md) |
| Architecture | [LLM_CONTEXT.md](LLM_CONTEXT.md) |
