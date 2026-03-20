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
- Payment service (Bun + Express): payment-related processing flow
- MySQL: persistent data storage
- Nginx: reverse proxy, SSL termination, domain routing

## 2. Repository Architecture

Main folders:

- [ruet-hall-man-web](ruet-hall-man-web)
- [ruet-hall-man-admin](ruet-hall-man-admin)
- [ruet-hall-man-backend](ruet-hall-man-backend)
- [payment-server](payment-server)
- [nginx](nginx)
- [docker-compose.yml](docker-compose.yml)
- [.env](.env)

Runtime model in this repository:

- web, admin, payment-server use Bun-based Docker images
- backend uses Node Docker image
- deployment entry point is root [docker-compose.yml](docker-compose.yml)

## 3. Tech Stack

- Frontend: Next.js 16, React 19, TypeScript
- Backend: Node.js, Express, Drizzle ORM, MySQL
- Payment service: Bun, Express
- Infra: Docker Compose, Nginx, Certbot
- Hosting target: Azure Ubuntu VM

## 4. Environment Configuration

Use root [.env](.env) for Docker Compose deployment.

Minimum required values:

- MySQL credentials: `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`
- Ports: `BACKEND_PORT`, `PAYMENT_SERVER_PORT`, `NGINX_HTTP_PORT`, `NGINX_HTTPS_PORT`
- Frontend rewrite target in Docker network: `BACKEND_API_URL=http://backend:8000`
- CORS URLs: `STUDENT_URL`, `ADMIN_URL`
- Cloudinary and JWT secrets

Security baseline:

```bash
cd ~/hall-management
grep -qxF ".env" .gitignore || echo ".env" >> .gitignore
chmod 600 .env
```

## 5. Local or VM Build and Run

For small machines (for example 4 GB VM), build services in sequence:

```bash
cd ~/hall-management
docker compose build web
docker compose build admin
docker compose build backend
docker compose build payment-server
docker compose up -d
docker compose ps
```

## 6. First-Time Database Setup

Create DB if needed:

```bash
docker compose exec mysql \
  sh -lc 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS ${MYSQL_DATABASE};"'
```

Run migrations + seed:

```bash
docker compose exec backend npm run db-all
```

If seed already exists:

```bash
docker compose exec backend npm run db
```

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
5. Issue SSL certificate with Certbot standalone
6. Enable SSL Nginx config and restart nginx service
7. Add certbot renew cron with pre/post hooks for nginx stop/start
8. Verify HTTPS externally and from VM

Detailed command reference:

- [VM_DEPLOYMENT_FROM_SCRATCH.md](VM_DEPLOYMENT_FROM_SCRATCH.md)

## 9. Nginx and API Protection

Nginx API route includes request limiting to reduce abuse risk.

Current config source:

- [nginx/ruet-hall-management.conf](nginx/ruet-hall-management.conf)

## 10. Operations and Maintenance

Daily update routine:

```bash
cd ~/hall-management
git pull
docker compose build web
docker compose build admin
docker compose build backend
docker compose build payment-server
docker compose up -d
docker image prune -f
```

After VM reboot:

```bash
sudo systemctl is-enabled docker
sudo systemctl is-active docker
cd ~/hall-management
docker compose ps
docker compose up -d
```

## 11. Troubleshooting Quick List

- Frontend cannot call API from browser: confirm it calls `/api`, not internal docker hostname directly
- Backend starts before DB: confirm mysql is healthy in `docker compose ps`
- SSL renewal fails: ensure nginx is stopped during certbot standalone challenge
- Build fails on low memory: build services one-by-one, not all-at-once

## 12. Recommended Documentation Usage

- Read this file for overall project lifecycle and architecture
- Use [VM_DEPLOYMENT_FROM_SCRATCH.md](VM_DEPLOYMENT_FROM_SCRATCH.md) for exact VM deployment steps
- Keep [docker-compose.yml](docker-compose.yml) and [nginx/ruet-hall-management.conf](nginx/ruet-hall-management.conf) as the source of truth for runtime behavior
