# RUET Hall Management VM Deployment (From Scratch)

This runbook is VM-only and uses one compose file:

- `docker-compose.yml`

It assumes Ubuntu 24.04 on Azure VM and domains:

- `app.aniruddha81.tech`
- `admin.aniruddha81.tech`
- `api.aniruddha81.tech`

---

## Partial Reset (Certs + Snap Certbot Already Set Up)

Use this path if you had a VM issue and need to redeploy **without** wiping SSL certs or the certbot snap. The certificates in `/etc/letsencrypt` and the snap certbot timer survive VM restarts and re-clones — they live on the VM filesystem, not in Docker.

**Skip:** Steps 0, 8.1–8.4, and 9.

**Run these in order:**

```bash
# 1. Prep VM tools (only if wiped)
sudo apt remove -y $(dpkg --get-selections docker.io docker-compose docker-compose-v2 docker-doc podman-docker containerd runc | cut -f1)

# Add Docker's official GPG key:
sudo apt update
sudo apt install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update

sudo apt upgrade -y

sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo systemctl status docker

sudo systemctl start docker

sudo systemctl enable docker


sudo usermod -aG docker $USER


newgrp docker

# 2. Pull latest code (repo already exists on VM)
cd ~/ruet-hall-mgmt
docker compose down -v --remove-orphans || true

docker rm -f $(docker ps -aq) 2>/dev/null || true
docker volume prune -f
docker network prune -f
docker image prune -af
docker builder prune -af

git fetch origin deploy
git checkout deploy
git reset --hard origin/deploy

# 3. Build and start
#    nginx.conf in the repo already contains SSL blocks — no manual patching needed.
docker compose build
docker compose up -d

# 4. Init DB (only if data was lost)
#    Wait for MySQL to fully initialize (healthcheck passes before user setup completes)
sleep 15
docker compose exec mysql sh -lc \
  'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS ${MYSQL_DATABASE};"'
docker compose exec backend npm run db-all

# 5. Verify all services are healthy
docker compose ps
```

Expected result: all services up and healthy, HTTPS working with the existing cert. No need to manually write `nginx.conf` — the SSL version is committed to the repo.

---

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

cd ~
rm -rf ~/ruet-hall-mgmt

sudo systemctl restart docker
```

Expected pass:

- `docker ps` returns no running containers.

## 1. Prepare VM

```bash
sudo apt remove -y $(dpkg --get-selections docker.io docker-compose docker-compose-v2 docker-doc podman-docker containerd runc | cut -f1)

# Add Docker's official GPG key:
sudo apt update
sudo apt install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update

sudo apt upgrade -y

sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo systemctl status docker

sudo systemctl start docker

sudo systemctl enable docker


sudo usermod -aG docker $USER


newgrp docker

# Install certbot via snap (auto-renewal timer included)
sudo apt remove certbot -y 2>/dev/null || true
sudo snap install core && sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot

# Create webroot directory for ACME challenges
sudo mkdir -p /var/www/certbot

docker --version
docker compose version
certbot --version
```

Expected pass:

- All three version commands print valid versions.
- `certbot --version` shows the snap-installed version.

## 2. Get Project on VM

```bash
cd ~
git clone https://github.com/aniruddha81/ruet-hall-mgmt.git
cd ruet-hall-mgmt
```

## 3. Create `.env`

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

NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=change-me-encryption-key

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

Generate secrets:

```bash
# Run this 3 times — once each for ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

Important:

- Do not set `MYSQL_USER=root`.

Protect secrets:

```bash
cd ~/ruet-hall-mgmt
grep -qxF ".env" .gitignore || echo ".env" >> .gitignore
chmod 600 .env
```

Expected pass:

- `ls -l .env` starts with `-rw-------`.

## 4. Ensure HTTP Nginx Config First

Before SSL, activate the HTTP bootstrap config (listen 80 only). This allows first-time browser access over HTTP and certbot challenge validation.

```bash
cd ~/ruet-hall-mgmt
cp nginx.http.conf nginx.conf
docker compose up -d --force-recreate nginx
```

Quick check:

```bash
grep -nE "listen 443|ssl_certificate|options-ssl-nginx" nginx.conf
```

Expected pass:

- No output (no SSL directives yet).

Verify ACME challenge blocks are present:

```bash
grep -c "acme-challenge" nginx.conf
```

Expected pass:

- Output is `3` (one per server block).

## 5. Build and Start Stack

On small VM, build frontends one at a time to avoid RAM spike:

```bash
cd ~/ruet-hall-mgmt
docker compose build
```

Start:

```bash
docker compose up -d
```

Check:

```bash
docker compose ps
```

Expected pass:

- `hallmgmt-mysql` is `Up (...) (healthy)`
- `hallmgmt-backend` is `Up`
- `hallmgmt-pay-server` is `Up`
- `hallmgmt-student-web` is `Up`
- `hallmgmt-admin-web` is `Up`
- `hallmgmt-nginx` is `Up`

### 5.1 Initialize DB Schema and Seed Data (First time only)

Wait ~15 seconds after `docker compose up -d` for MySQL to fully initialize:

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

- If seed data already exists, `db-all` can fail due to duplicates. Run only migrations:

```bash
docker compose exec backend npm run db
```

## 6. VM-side Routing Tests

```bash
curl -I -H "Host: app.aniruddha81.tech" http://127.0.0.1
curl -I -H "Host: admin.aniruddha81.tech" http://127.0.0.1
curl -I -H "Host: api.aniruddha81.tech" http://127.0.0.1
```

Expected pass:

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

### 8.1 Issue certificate using webroot (no nginx downtime)

Nginx stays running the entire time. Certbot writes challenge files to `/var/www/certbot` on the VM, which is mounted read-only into the nginx container.

```bash
sudo certbot certonly --webroot \
  --webroot-path /var/www/certbot \
  --cert-name aniruddha81.tech \
  -d app.aniruddha81.tech \
  -d admin.aniruddha81.tech \
  -d api.aniruddha81.tech
```

### 8.2 Verify certificate files exist

```bash
sudo ls -l /etc/letsencrypt/live/aniruddha81.tech/fullchain.pem
sudo certbot certificates
```

Expected pass:

- `fullchain.pem` exists under `aniruddha81.tech`
- Certificate includes all 3 domains in SAN list

### 8.3 Apply the SSL nginx config

Now that certificates exist, switch to the SSL nginx config.

```bash
cd ~/ruet-hall-mgmt
cp nginx.ssl.conf nginx.conf
docker compose up -d --force-recreate nginx
```

*(After this, normal deploy workflow will keep things safe: it auto-selects `nginx.ssl.conf` when cert files exist, otherwise `nginx.http.conf`.)*

### 8.4 Restart nginx and validate logs

```bash
docker compose logs nginx --tail=100
```

Expected pass:

- No `[emerg]` errors.

### 8.5 VM-side HTTPS tests (authoritative)

```bash
curl -I --resolve app.aniruddha81.tech:443:127.0.0.1 https://app.aniruddha81.tech
curl -I --resolve admin.aniruddha81.tech:443:127.0.0.1 https://admin.aniruddha81.tech
curl -I --resolve api.aniruddha81.tech:443:127.0.0.1 https://api.aniruddha81.tech
```

Expected pass:

- app: `HTTP/1.1 200 OK`
- admin: `HTTP/1.1 200 OK` or `HTTP/1.1 307 Temporary Redirect`
- api: `HTTP/1.1 200 OK`

### 8.6 Public HTTPS tests

```bash
curl -I https://app.aniruddha81.tech
curl -I https://admin.aniruddha81.tech
curl -I https://api.aniruddha81.tech
```

Expected pass:

- 200/301/307 responses with valid certificate chain in browser.

## 9. Auto-renew SSL (Snap handles it — no cron needed)

The snap-installed certbot includes a systemd timer that runs twice daily. If any cert is within 30 days of expiry, it renews automatically using webroot. No manual crontab entry needed.

Add a `renew_hook` so nginx reloads the new cert after each successful renewal:

```bash
sudo nano /etc/letsencrypt/renewal/aniruddha81.tech.conf
```

Add this line at the bottom of the `[renewalparams]` section:

```ini
renew_hook = docker compose -f /home/azureuser/ruet-hall-mgmt/docker-compose.yml restart nginx
```

Verify the timer is active:

```bash
sudo systemctl list-timers | grep certbot
```

Expected pass:

- A `snap.certbot.renew.timer` entry is listed.

Dry-run test:

```bash
sudo certbot renew --dry-run
```

Expected pass:

- `Congratulations, all simulated renewals succeeded`

### How auto-renewal works

```text
Snap certbot timer runs twice daily
         |
         v
cert expiring within 30 days?
         |
         |-- No  -> do nothing
         +-- Yes -> renew using webroot
                        |
                        |-- nginx serves /.well-known/acme-challenge/  <- no downtime
                        |-- cert renewed
                        +-- renew_hook fires -> docker compose restart nginx
                                                    <- picks up new cert
```

Zero downtime. No cron. No stopping nginx.

## 10. Daily Ops

Update deployment:

```bash
cd ~/ruet-hall-mgmt
git pull
docker compose build
docker compose up -d
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

- Docker daemon starts automatically at boot (`sudo systemctl enable docker` was set in step 1).
- All services use `restart: unless-stopped`, so Docker will auto-restart every container that was running before shutdown.
- The `nginx.conf` in the repo is the SSL version. No manual patching is needed — `git reset --hard` preserves HTTPS.
- `depends_on: service_healthy` ensures correct startup order: mysql → backend → admin/web → nginx.

### Quick Verification After VM Boot

```bash
sudo systemctl is-enabled docker   # expect: enabled
sudo systemctl is-active docker    # expect: active
cd ~/ruet-hall-mgmt
docker compose ps
```

Expected: All 6 services show `Up` and `(healthy)` for mysql, backend, admin, web.

If nginx shows `Up` but HTTPS doesn't work, check that certs still exist:

```bash
sudo ls /etc/letsencrypt/live/aniruddha81.tech/fullchain.pem
```

### If Any Service Is Not Running

```bash
cd ~/ruet-hall-mgmt
docker compose up -d
```

This brings up any stopped/crashed containers while leaving healthy ones untouched.

### Full Health Check Script (Run After Any Restart)

```bash
cd ~/ruet-hall-mgmt
docker compose up -d

# Wait for all health checks to pass
echo "Waiting for services to become healthy..."
for i in $(seq 1 30); do
  UNHEALTHY=$(docker compose ps --format json | grep -c '"unhealthy"\|"starting"' || true)
  if [ "$UNHEALTHY" -eq 0 ]; then
    echo "✅ All services healthy!"
    break
  fi
  echo "  Attempt $i/30 — $UNHEALTHY service(s) still starting..."
  sleep 5
done

docker compose ps

# Quick HTTPS verification
curl -sI --resolve app.aniruddha81.tech:443:127.0.0.1 https://app.aniruddha81.tech | head -1
curl -sI --resolve admin.aniruddha81.tech:443:127.0.0.1 https://admin.aniruddha81.tech | head -1
curl -sI --resolve api.aniruddha81.tech:443:127.0.0.1 https://api.aniruddha81.tech | head -1
```

Expected: HTTP/1.1 200/301/307 responses for all three.

### Important Notes

- If you had manually run `docker compose stop ...` before shutting down the VM, those stopped containers may stay stopped after reboot. Use `docker compose up -d` to start them.
- The health check ordering guarantees nginx won't start proxying until admin/web/backend are actually ready (no more 502s).

## 12. MySQL Backup to Private GitHub Repo

Regular backups protect your data if the VM is destroyed or the volume is lost.

### One-time Setup

**Create a private GitHub repo** named `ruet-hall-backups`.

**Generate a GitHub Personal Access Token:**

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **Generate new token (classic)**
3. Name: `ruet-hall-backup`
4. Expiry: No expiration (or 1 year)
5. Scope: check only `repo`
6. Click **Generate token** → copy it immediately

**On the VM — clone the backup repo:**

```bash
cd ~
git clone https://github.com/aniruddha81/ruet-hall-backups.git db-backups
cd db-backups

git config user.email "ar.roy564@gmail.com"
git config user.name "Aniruddha Roy"

# Store token so git push works without prompting
git remote set-url origin https://<YOUR_GITHUB_TOKEN>@github.com/aniruddha81/ruet-hall-backups.git
```

### Create the Backup Script

```bash
nano ~/backup-db.sh
```

Paste:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR=~/db-backups
DATE=$(date +%Y-%m-%d_%H-%M)
FILENAME="hall_db_$DATE.sql"
COMPOSE_DIR=~/ruet-hall-mgmt

# Dump database
docker exec hallmgmt-mysql mysqldump \
  -u halladmin -p"$(grep MYSQL_PASSWORD $COMPOSE_DIR/.env | cut -d= -f2)" \
  hall_db > "$BACKUP_DIR/$FILENAME"

echo "Backup created: $FILENAME"

# Keep only last 7 backups
cd "$BACKUP_DIR"
ls -t hall_db_*.sql | tail -n +8 | xargs -r rm --

# Push to GitHub
git add .
git commit -m "backup: $DATE"
git push origin main

echo "Backup pushed to GitHub!"
```

Make executable and test:

```bash
chmod +x ~/backup-db.sh
bash ~/backup-db.sh
```

Check your GitHub repo — a `.sql` file should be committed. ✅

### Automate — Daily at 2 AM

```bash
crontab -e
```

Add:

```cron
0 2 * * * /bin/bash /home/azureuser/backup-db.sh >> /home/azureuser/backup.log 2>&1
```

Check logs anytime:

```bash
cat ~/backup.log
```

## 13. Restore DB Backup on New VM

When rebuilding the VM, restore the latest backup:

```bash
# Clone backup repo on new VM
git clone https://github.com/aniruddha81/ruet-hall-backups.git ~/db-backups

# Start stack first
cd ~/ruet-hall-mgmt
docker compose up -d

# Wait for MySQL to be healthy
sleep 20

# Restore latest backup
LATEST=$(ls -t ~/db-backups/hall_db_*.sql | head -1)
echo "Restoring: $LATEST"

docker exec -i hallmgmt-mysql mysql \
  -u halladmin -pYOUR_PASSWORD hall_db < "$LATEST"

echo "Restore complete!"
```

## 14. Full VM Rebuild Checklist

If you destroy the VM and create a new one:

- [ ] New VM created (Ubuntu 24.04, B2als v2, Central India)
- [ ] Public IP set to Static in Azure Portal (or reassign old static IP)
- [ ] DNS A records updated at registrar if IP changed:
  - `app`   → new VM IP
  - `admin` → new VM IP
  - `api`   → new VM IP
- [ ] DNS propagation verified (`nslookup app.aniruddha81.tech`)
- [ ] SSH into new VM working
- [ ] Steps 1–9 of this runbook completed
- [ ] DB restored from backup repo (Step 13)
- [ ] HTTPS working on all 3 subdomains ✅
- [ ] Backup script re-cloned and cron re-added (Step 12)
- [ ] `sudo systemctl list-timers | grep certbot` shows timer ✅
