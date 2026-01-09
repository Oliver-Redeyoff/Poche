# Poche Production Deployment Guide

This guide explains how to deploy Poche on a production server.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed
- A domain name with DNS configured (e.g., `poche.to` and `api.poche.to`)
- Cloudflare account (for DNS and SSL certificate generation)
- Resend account (for transactional emails)

## Architecture Overview

The production deployment consists of:

- **PostgreSQL** - Database for users, sessions, and articles
- **Poche API** - Node.js backend (Hono + Better Auth + Drizzle ORM)
- **Nginx** - Reverse proxy with HTTPS termination
- **Webapp** - Static files served by Nginx

```
                    ┌─────────────────────────────────────────────────┐
                    │                    Server                        │
                    │                                                  │
Internet ──────────►│  Nginx (ports 80, 443)                          │
                    │    ├── api.poche.to → Poche API (port 3000)     │
                    │    └── poche.to → Static webapp files            │
                    │                                                  │
                    │  PostgreSQL (port 5432, internal only)          │
                    └─────────────────────────────────────────────────┘
```

## Step 1: Clone the Repository

```bash
git clone https://github.com/your-repo/Poche.git
cd Poche/backend
```

## Step 2: Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database Configuration
POSTGRES_USER=poche
POSTGRES_PASSWORD=YourSecurePassword123
POSTGRES_DB=poche

# Authentication
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters-long-generate-with-openssl
BETTER_AUTH_URL=https://api.poche.to

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

### Important Notes:

- **Syntax**: Use `=` (equals sign), NOT `:` (colon) for all variables
- **POSTGRES_PASSWORD**: Must NOT contain special characters (`@`, `:`, `/`, `#`, `+`, backticks). Use only letters and numbers.
- **BETTER_AUTH_SECRET**: Generate with `openssl rand -base64 32`
- **RESEND_API_KEY**: Get from [Resend Dashboard](https://resend.com/api-keys)

Verify your `.env` is correctly formatted:
```bash
docker compose config
```
This will show the resolved configuration with all environment variables expanded.

## Step 3: Configure DNS

Point your domains to your server's IP address in Cloudflare (or your DNS provider):

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | api.poche.to | YOUR_SERVER_IP | Proxied (orange cloud) |
| A | poche.to | YOUR_SERVER_IP | Proxied (orange cloud) |

If using Cloudflare proxy, set SSL/TLS mode to **Full (strict)**.

## Step 4: Generate SSL Certificates

We use Certbot with the Cloudflare DNS plugin for Let's Encrypt certificates.

### Install Certbot

```bash
sudo snap install --classic certbot
sudo snap set certbot trust-plugin-with-root=ok
sudo snap install certbot-dns-cloudflare
```

### Create Cloudflare Credentials

1. Go to Cloudflare Dashboard → Profile → API Tokens
2. Create a token with `Zone:DNS:Edit` permission for your domain
3. Create credentials file:

```bash
sudo mkdir -p /etc/letsencrypt
sudo nano /etc/letsencrypt/cloudflare.ini
```

Add:
```ini
dns_cloudflare_api_token = YOUR_CLOUDFLARE_API_TOKEN
```

Secure the file:
```bash
sudo chmod 600 /etc/letsencrypt/cloudflare.ini
```

### Generate Certificates

```bash
# For API domain
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d api.poche.to

# For webapp domain
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d poche.to
```

### Set Up Auto-Renewal Hook

```bash
sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy
echo '#!/bin/bash
docker restart poche-nginx' | sudo tee /etc/letsencrypt/renewal-hooks/deploy/restart-nginx.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/restart-nginx.sh
```

## Step 5: Build and Deploy the Webapp

Build the webapp and deploy to the backend directory:

```bash
cd ../webapp
npm install
npm run build:deploy
```

This builds the webapp and moves it to `backend/web_app_dist/`.

## Step 6: Start the Services

```bash
cd ../backend
docker compose up -d --build
```

This starts:
- `poche-db` - PostgreSQL database
- `poche-api` - Poche backend API
- `poche-nginx` - Nginx reverse proxy

## Step 7: Run Database Migrations

The database tables need to be created. Run Drizzle migrations from the host:

```bash
# Temporarily expose PostgreSQL port
# Add to docker-compose.yml under db service:
#   ports:
#     - "5432:5432"

# Restart to apply
docker compose up -d

# Run migrations (replace with your actual password)
cd backend
DATABASE_URL=postgresql://poche:YourSecurePassword123@localhost:5432/poche npx drizzle-kit push

# IMPORTANT: Remove port exposure from docker-compose.yml after migrations
# Leaving 5432 exposed can cause connection spam from local database tools
# Then restart again
docker compose up -d
```

> ⚠️ **Important**: Remove the port 5432 exposure after running migrations. Local database management tools (pgAdmin, DBeaver, etc.) may continuously try to connect using default "postgres" credentials, causing log spam and potential security issues.

## Step 8: Verify Deployment

Check that all services are running:

```bash
docker compose ps
```

Expected output:
```
NAME          IMAGE            STATUS                   PORTS
poche-api     backend-api      Up (healthy)            3000/tcp
poche-db      postgres:16      Up (healthy)            5432/tcp
poche-nginx   nginx:alpine     Up                      0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

Test the API:
```bash
curl https://api.poche.to/
```

Visit your webapp:
```
https://poche.to
```

## Troubleshooting

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f nginx
docker compose logs -f db
```

### Common Issues

#### CORS Errors

If you see CORS errors in the browser console, ensure your domain is in the allowed origins list in `backend/src/index.ts`:

```typescript
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://poche.to'],
    credentials: true,
  }),
)
```

Rebuild and restart after changes:
```bash
docker compose up -d --build
```

#### Database Connection Errors

If you see `Cannot read properties of undefined (reading 'searchParams')`:
- Your `POSTGRES_PASSWORD` contains special characters
- Change to a simple password (letters and numbers only)
- Update the password in PostgreSQL if already initialized

#### "Role postgres does not exist" Errors

If you see repeated errors like:
```
FATAL: password authentication failed for user "postgres"
DETAIL: Role "postgres" does not exist.
```

This happens when `POSTGRES_USER` is set to something other than "postgres" (e.g., "poche"). PostgreSQL creates only the specified user as superuser and does NOT create a default "postgres" role.

**Common causes:**
1. **Local database tools** (pgAdmin, DBeaver, TablePlus, DataGrip, VS Code extensions) trying to connect to `localhost:5432` with default "postgres" credentials
2. **Exposed port 5432** allowing external connection attempts

**Solutions:**
- Comment out or remove the `ports: "5432:5432"` mapping in docker-compose.yml if you don't need local access
- If you need local access, use a non-standard port: `ports: "54321:5432"`
- Check and reconfigure any database management tools with saved connections to localhost:5432

#### .env File Syntax Errors

Ensure your `.env` file uses `=` (equals sign), not `:` (colon):

```env
# ✅ Correct
PORT=3000

# ❌ Wrong - will cause silent failures
PORT:3000
```

Verify your environment variables are loading correctly:
```bash
docker compose config
```

#### SSL Certificate Errors

If Nginx can't find certificates:
```
cannot load certificate "/etc/letsencrypt/live/poche.to/fullchain.pem"
```

- Ensure certificates were generated for the exact domain
- Check that `/etc/letsencrypt` is mounted in docker-compose.yml
- Verify certificate exists: `sudo ls -la /etc/letsencrypt/live/poche.to/`

#### 444 Errors

Nginx returns 444 (connection closed without response) when:
- The `Host` header doesn't match any `server_name`
- Check your nginx.conf server blocks
- Ensure DNS is pointing to the correct server

### Rebuild Everything

```bash
docker compose down
docker compose up -d --build
```

### Reset Database (loses all data)

```bash
docker compose down
docker volume rm poche_postgres_data
docker compose up -d
# Then run migrations again
```

## Updating the Application

### Update Backend

```bash
cd backend
git pull
docker compose up -d --build
```

### Update Webapp

```bash
cd webapp
git pull
npm install
npm run build:deploy
docker restart poche-nginx
```

## Configuration Files

### docker-compose.yml

Located at `backend/docker-compose.yml`. Defines:
- PostgreSQL service (`db`)
- Poche API service (`api`)
- Nginx reverse proxy (`nginx`)

### nginx.conf

Located at `backend/nginx.conf`. Configures:
- HTTPS for `api.poche.to` (proxies to Poche API)
- HTTPS for `poche.to` (serves webapp static files)
- HTTP to HTTPS redirects
- SSL/TLS settings

### Webapp Environment

The webapp uses Vite environment variables. Create `webapp/.env` for production builds:

```env
VITE_API_URL=https://api.poche.to
```

## Security Checklist

- [ ] Strong POSTGRES_PASSWORD (no special characters, 20+ characters)
- [ ] Strong BETTER_AUTH_SECRET (32+ characters, randomly generated)
- [ ] PostgreSQL port (5432) NOT exposed in docker-compose.yml (remove after migrations)
- [ ] No local database tools configured to auto-connect to localhost:5432
- [ ] SSL certificates valid and auto-renewing
- [ ] Cloudflare API token has minimal permissions
- [ ] `.env` file not committed to git
- [ ] `.env` file uses correct syntax (`KEY=value`, not `KEY:value`)
- [ ] Firewall allows only ports 80, 443, and 22 (SSH)

## Monitoring

### Check Service Health

```bash
# API health
curl https://api.poche.to/

# Container status
docker compose ps

# Resource usage
docker stats
```

### Logs Location

- Docker logs: `docker compose logs -f`
- Certbot logs: `/var/log/letsencrypt/`
- System logs: `journalctl -u docker`

## Backup

### Database Backup

```bash
docker compose exec db pg_dump -U poche poche > backup_$(date +%Y%m%d).sql
```

### Database Restore

```bash
cat backup_20240101.sql | docker compose exec -T db psql -U poche poche
```

## Support

For issues, check:
1. Docker logs: `docker compose logs -f`
2. SUMMARY.md files in each project directory
3. GitHub Issues on the repository

