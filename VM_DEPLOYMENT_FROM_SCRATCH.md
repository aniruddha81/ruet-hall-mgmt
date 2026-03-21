# RUET Hall Management VM Deployment (From Scratch)

This runbook is VM-only and uses one compose file:

- `docker-compose.yml`

It assumes Ubuntu 24.04 on Azure VM and domains:

- `app.aniruddha81.tech`
- `admin.aniruddha81.tech`
- `api.aniruddha81.tech`

## 0. Full Reset on VM (Optional but clean)

```bash
cd ~
if [ -d ruet-hall-mgmt ]; then
  cd ruet-hall-mgmt
  docker compose down -v --remove-orphans || true
fi

docker rm -f $(docker ps -aq) 2>/dev/null || true
docker volume prune -f
docker network prune -f
docker image prune -af
docker builder prune -af

sudo rm -rf /etc/letsencrypt /var/lib/letsencrypt /var/log/letsencrypt
rm -rf ~/ruet-hall-mgmt

# Remove certbot auto-renewal crontab entry
sudo crontab -l 2>/dev/null | grep -v 'certbot renew' | sudo crontab -

sudo systemctl restart docker
```

Expected pass:

- `docker ps` returns no running containers.

## 1. Prepare VM

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git certbot docker-compose-plugin
sudo systemctl enable docker

docker --version
docker compose version
certbot --version
```

Expected pass:

- All three version commands print valid versions.

## 2. Get Project on VM

```bash
cd ~
git clone https://github.com/aniruddha81/ruet-hall-mgmt.git
cd ruet-hall-mgmt
```

If you are not using git, upload and extract project into `~/ruet-hall-mgmt`.

## 3. Create `.env`

Create file:

```bash
nano ~/ruet-hall-mgmt/.env
```

Use this template and replace placeholders:

```env
MYSQL_ROOT_PASSWORD=change-me-root-password
MYSQL_DATABASE=hall_db
MYSQL_USER=halladmin
MYSQL_PASSWORD=change-me-db-password

BACKEND_PORT=8000
PAYMENT_SERVER_PORT=8080
BACKEND_API_URL=http://backend:8000

NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443

STUDENT_URL=https://app.aniruddha81.tech
ADMIN_URL=https://admin.aniruddha81.tech

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

ACCESS_TOKEN_SECRET=change-me-access-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=change-me-refresh-secret
REFRESH_TOKEN_EXPIRY=10d
```

Important:

- Do not set `MYSQL_USER=root`.

Protect secrets on VM:

```bash
cd ~/ruet-hall-mgmt
grep -qxF ".env" .gitignore || echo ".env" >> .gitignore
chmod 600 .env
```

Expected pass:

- `ls -l .env` starts with `-rw-------`.

## 4. Ensure HTTP Nginx Config First

Before SSL, keep `nginx.conf` in HTTP-only mode (listen 80 only).

Quick check:

```bash
grep -nE "listen 443|ssl_certificate|options-ssl-nginx" nginx.conf
```

Expected pass:

- No output.

## 5. Build and Start Stack

On small VM, build frontends first:

```bash
cd ~/ruet-hall-mgmt
docker compose build web
docker compose build admin
docker compose build backend
docker compose build pay
```

Start:

```bash
docker compose up -d --force-recreate
```

Check:

```bash
docker compose ps
```

Expected pass demo:

- `hallmgmt-mysql` is `Up (...) (healthy)`
- `hallmgmt-backend` is `Up`
- `hallmgmt-pay-server` is `Up`
- `hallmgmt-student-web` is `Up`
- `hallmgmt-admin-web` is `Up`
- `hallmgmt-nginx` is `Up`

### 5.1 Initialize DB Schema and Seed Data (First time only)

Create database if missing:

```bash
docker compose exec mysql \
  sh -lc 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS ${MYSQL_DATABASE};"'
```

Generate migrations, migrate, and seed:

```bash
docker compose exec backend npm run db-all
```

Verify tables:

```bash
docker compose exec mysql \
  sh -lc 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -D "$MYSQL_DATABASE" -e "SHOW TABLES;"'
```

Notes:

- MySQL may print `Using a password on the command line interface can be insecure.` This warning is expected in this workflow.
- If seed data already exists, `db-all` can fail due to duplicates. In that case run only:

```bash
docker compose exec backend npm run db
```

## 6. VM-side Routing Tests

Run on VM:

```bash
curl -I -H "Host: app.aniruddha81.tech" http://127.0.0.1
curl -I -H "Host: admin.aniruddha81.tech" http://127.0.0.1
curl -I -H "Host: api.aniruddha81.tech" http://127.0.0.1
```

Expected pass demo:

- app: `HTTP/1.1 200 OK`
- admin: `HTTP/1.1 200 OK` or `HTTP/1.1 307 Temporary Redirect`
- api: `HTTP/1.1 200 OK`

## 7. Public Access Checks

From your local machine:

```bash
nslookup app.aniruddha81.tech
nslookup admin.aniruddha81.tech
nslookup api.aniruddha81.tech
```

Expected pass:

- All resolve to VM public IP.

Browser tests (HTTP first):

- `http://app.aniruddha81.tech`
- `http://admin.aniruddha81.tech`
- `http://api.aniruddha81.tech`

If not opening:

- Confirm Azure NSG allows inbound 80/443.
- Confirm DNS A records are correct.
- Confirm nginx container is Up.

## 8. Enable SSL (After HTTP Works)

### 8.1 Stop nginx (free port 80 for certbot)

```bash
docker compose stop nginx
```

### 8.2 Issue or update one certificate for all 3 domains

```bash
sudo certbot certonly --standalone --cert-name app.aniruddha81.tech \
  -d app.aniruddha81.tech \
  -d admin.aniruddha81.tech \
  -d api.aniruddha81.tech
```

### 8.3 Verify certificate files exist

```bash
sudo ls -l /etc/letsencrypt/live/app.aniruddha81.tech/fullchain.pem
sudo certbot certificates
```

Expected pass:

- fullchain.pem exists under `app.aniruddha81.tech`
- certificate includes all 3 domains in SAN list

### 8.4 Replace nginx config with SSL blocks

```bash
cat > ~/ruet-hall-mgmt/nginx.conf <<'EOF'
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/m;

server {
  listen 80;
  server_name app.aniruddha81.tech;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  server_name app.aniruddha81.tech;

  ssl_certificate     /etc/letsencrypt/live/app.aniruddha81.tech/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/app.aniruddha81.tech/privkey.pem;

  location / {
    proxy_pass         http://web:3001;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection "upgrade";
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
    proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }
}

server {
  listen 80;
  server_name admin.aniruddha81.tech;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  server_name admin.aniruddha81.tech;

  ssl_certificate     /etc/letsencrypt/live/app.aniruddha81.tech/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/app.aniruddha81.tech/privkey.pem;

  location / {
    proxy_pass         http://admin:4001;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection "upgrade";
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
    proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }
}

server {
  listen 80;
  server_name api.aniruddha81.tech;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  server_name api.aniruddha81.tech;

  ssl_certificate     /etc/letsencrypt/live/app.aniruddha81.tech/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/app.aniruddha81.tech/privkey.pem;

  location / {
    limit_req          zone=api_limit burst=10 nodelay;
    proxy_pass         http://backend:8000;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection "upgrade";
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
    proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }
}
EOF
```

### 8.5 Start nginx and validate logs

```bash
docker compose up -d --force-recreate nginx
docker compose logs nginx --tail=100
```

Expected pass:

- No `[emerg]` errors.

### 8.6 VM-side HTTPS tests (authoritative)

```bash
curl -I --resolve app.aniruddha81.tech:443:127.0.0.1 https://app.aniruddha81.tech
curl -I --resolve admin.aniruddha81.tech:443:127.0.0.1 https://admin.aniruddha81.tech
curl -I --resolve api.aniruddha81.tech:443:127.0.0.1 https://api.aniruddha81.tech
```

Expected pass demo:

- app: `HTTP/1.1 200 OK`
- admin: `HTTP/1.1 200 OK` or `HTTP/1.1 307 Temporary Redirect`
- api: `HTTP/1.1 200 OK`

### 8.7 Public HTTPS tests

```bash
curl -I https://app.aniruddha81.tech
curl -I https://admin.aniruddha81.tech
curl -I https://api.aniruddha81.tech
```

Expected pass demo:

- 200/301/307 responses with valid certificate chain in browser.

## 9. Auto-renew SSL

```bash
sudo crontab -e
```

Add:

```cron
0 3 * * * certbot renew --quiet --standalone --pre-hook "docker compose -f /home/azureuser/ruet-hall-mgmt/docker-compose.yml stop nginx" --post-hook "docker compose -f /home/azureuser/ruet-hall-mgmt/docker-compose.yml up -d nginx"
```

Test:

```bash
sudo certbot renew --dry-run --standalone --pre-hook "docker compose -f /home/azureuser/ruet-hall-mgmt/docker-compose.yml stop nginx" --post-hook "docker compose -f /home/azureuser/ruet-hall-mgmt/docker-compose.yml up -d nginx"
```

Expected pass:

- `Congratulations, all simulated renewals succeeded`
- `Hook 'pre-hook' ran with error output` or `Hook 'post-hook' ran with error output` can still be acceptable when containers stop/start successfully; Docker Compose may write normal status lines to stderr.

## 10. Daily Ops

Update deployment:

```bash
cd ~/ruet-hall-mgmt
git pull
docker compose build web
docker compose build admin
docker compose build backend
docker compose build pay
docker compose up -d --force-recreate
docker image prune -f
docker builder prune -f --keep-storage=2g
```

Monitor disk usage (important on 30 GB disk):

```bash
df -h /
docker system df
```

If disk is above 80%, run a deeper clean:

```bash
docker system prune -af --volumes
```

Warning: this removes ALL unused images, not just dangling ones. You will need to rebuild all services after this.

Useful logs:

```bash
docker compose logs -f
docker compose logs -f mysql
docker compose logs -f backend
docker compose logs -f nginx
```

## 11. VM Stop/Start Behavior (Azure Portal)

If you disconnect SSH, stop the VM from Azure Portal, and later start it again:

- Containers should auto-start if Docker daemon starts at boot and containers were not manually stopped before shutdown.
- This runbook already enables Docker at boot (`sudo systemctl enable docker`) and services use `restart: unless-stopped`.

Quick verification after VM boot:

```bash
sudo systemctl is-enabled docker
sudo systemctl is-active docker
cd ~/ruet-hall-mgmt
docker compose ps
```

If any service is not running, bring everything up:

```bash
cd ~/ruet-hall-mgmt
docker compose up -d --force-recreate
```

Important:

- If you had manually run `docker compose stop ...` before shutting down the VM, those stopped containers may stay stopped after reboot. Use `docker compose up -d --force-recreate` to start them.
