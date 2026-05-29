# RUET Hall Management - Project README

This document provides the full project journey from initial setup to production deployment.

If you want exact, command-by-command Azure VM deployment instructions, use:

- [VM_DEPLOYMENT_FROM_SCRATCH.md](VM_DEPLOYMENT_FROM_SCRATCH.md)

## 1. Project Overview

RUET Hall Management is a multi-service system for student hall operations.

Core modules:

- Student portal (Next.js): admissions, dining, finance, profile workflows
- Admin portal (Next.js): administration dashboard and management tools
- Backend API (Node + Express + Drizzle): authentication, business logic, database access
- SSLCommerz (sandbox/live): online payments via backend API
- PostgreSQL 18 (`postgres:18.4-alpine` in Docker): persistent data storage
- Nginx: reverse proxy, SSL termination, domain routing

## 2. Repository Architecture

Main folders:

- [web](web)
- [admin](admin)
- [backend](backend)
- [nginx](nginx)
- [docker-compose.yml](docker-compose.yml)
- [.env](.env)

Runtime model in this repository:

- web, admin, backend use Node.js Docker images
- deployment entry point is root [docker-compose.yml](docker-compose.yml)

## 3. Tech Stack

- Frontend: Next.js 16, React 19, TypeScript
- Backend: Node.js, Express, Drizzle ORM, PostgreSQL (`pg`)
- Infra: Docker Compose, Nginx, Certbot
- Hosting target: Azure Ubuntu VM

## 4. Environment Configuration

**Full guide:** [ENV_AND_RUN.md](ENV_AND_RUN.md) — every variable, development vs production, and run commands.

Quick start:

- **Local dev** (`npm run dev`, no Docker): [ENV_AND_RUN.md](ENV_AND_RUN.md) — `backend/.env`, `web/.env.local`, `admin/.env.local`
- **Production server** (Docker): root [.env](.env) from [.env.example](.env.example)

Security baseline:

```bash
cd ~/ruet-hall-mgmt
grep -qxF ".env" .gitignore || echo ".env" >> .gitignore
chmod 600 .env
```

## 5. Local or VM Build and Run

For small machines (for example 4 GB VM), build services in sequence:

```bash
cd ~/ruet-hall-mgmt
docker compose build web
docker compose build admin
docker compose build backend
docker compose up -d
docker compose ps
```

## 6. First-Time Database Setup

Postgres (`postgres:18.4-alpine`) creates `POSTGRES_DB` on first container start. After `docker compose ps` shows `hallmgmt-postgres` healthy, run migrations + seed:

```bash
docker compose exec backend npm run db-all
```

If schema exists and you only need migrations:

```bash
docker compose exec backend npm run db:migrate
```

Local compose (`docker-compose.local.yml`) exposes Postgres on host port **5433**; production compose uses **5432**.

## 7. Development Workflow

Typical feature workflow:

1. Create/update schema and backend module
2. Run migration and seed updates
3. Implement admin and student UI changes
4. Validate auth/session flows
5. Validate Nginx routing and API access
6. Rebuild only changed services

Helpful commands:

```bash
docker compose logs -f
docker compose logs -f backend
docker compose logs -f web
docker compose logs -f admin
docker compose logs -f nginx
```

## 8. Production Deployment Flow (Azure VM)

High-level process:

1. Prepare VM and DNS (app/admin/api subdomains)
2. Clone repo and configure root `.env`
3. Build and start Compose services
4. Verify HTTP routing for all domains
5. Issue SSL certificate with certbot **webroot** (nginx stays up)
6. Switch to SSL nginx config and restart nginx
7. Auto-renew is handled by the snap `certbot` timer; add a `renew_hook` to restart nginx
8. Verify HTTPS externally and from VM
9. Configure SSLCommerz IPN URL to `{API_PUBLIC_URL}/api/payments/sslcommerz/ipn` in the merchant panel

Detailed command reference:

- [VM_DEPLOYMENT_FROM_SCRATCH.md](VM_DEPLOYMENT_FROM_SCRATCH.md) — env template, compose stack (no `pay` service), SSLCommerz IPN

## 9. Nginx and API Protection

Nginx API route includes request limiting to reduce abuse risk.

Current config source:

- [nginx.conf](nginx.conf) (Nginx reverse proxy configuration)

## 10. Operations and Maintenance

Daily update routine:

```bash
cd ~/ruet-hall-mgmt
git pull
docker compose build web
docker compose build admin
docker compose build backend
docker compose up -d
docker image prune -f
```

After VM reboot:

```bash
sudo systemctl is-enabled docker
sudo systemctl is-active docker
cd ~/ruet-hall-mgmt
docker compose ps
docker compose up -d
```

## 11. Troubleshooting Quick List

- Frontend cannot call API from browser: confirm it calls `/api`, not internal docker hostname directly
- Backend starts before DB: confirm `hallmgmt-postgres` is healthy in `docker compose ps`
- SSL renewal fails: ensure nginx is stopped during certbot standalone challenge
- Build fails on low memory: build services one-by-one, not all-at-once

## 12. Recommended Documentation Usage

- Read this file for overall project lifecycle and architecture
- Use [VM_DEPLOYMENT_FROM_SCRATCH.md](VM_DEPLOYMENT_FROM_SCRATCH.md) for exact VM deployment steps
- Keep [docker-compose.yml](docker-compose.yml) and [nginx.conf](nginx.conf) as the source of truth for runtime behavior
