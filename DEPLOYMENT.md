# VINBOX Deployment Guide

This guide covers deploying VINBOX to your own infrastructure using Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- A domain name with DNS configured
- SSL certificates (or use Let's Encrypt via reverse proxy)
- PostgreSQL 16+ and Redis 7+ (handled by Docker Compose)
- Node.js 24+ (for local development)

## Quick Start (Local Development)

```bash
# Clone the repository
git clone https://github.com/elasho9x/inbox-zero.git
cd inbox-zero

# Install dependencies
pnpm install

# Start local development environment
pnpm local:start

# Access at http://localhost:3000
```

## Production Deployment

### 1. Prepare Environment

Create a `.env` file in `apps/web/` based on `.env.vinbox.example`:

```bash
cp .env.vinbox.example apps/web/.env
```

Required variables:
```env
# Branding
NEXT_PUBLIC_BRAND_NAME=VINBOX
NEXT_PUBLIC_SLACK_BOT_NAME=VINBOX

# Database (auto-configured by Docker Compose)
DATABASE_URL=postgresql://postgres:password@db:5432/vinbox?schema=public

# Redis
REDIS_HTTP_URL=http://serverless-redis-http:80
REDIS_HTTP_TOKEN=your_redis_token

# Authentication
AUTH_SECRET=your_32_char_secret
BETTER_AUTH_SECRET=your_32_char_secret
AUTH_REQUIRE_ALLOWLIST=true
AUTH_ALLOWED_EMAILS=admin@yourcompany.com

# OAuth Providers (configure at least one)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# Nylas (for IMAP/SMTP providers)
NYLAS_API_KEY=your_nylas_api_key
NYLAS_CLIENT_ID=your_nylas_client_id
NYLAS_REGION=us
NYLAS_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_NYLAS_ENABLED=true

# Email sending
NEXT_PUBLIC_EMAIL_SEND_ENABLED=true
EMAIL_ENCRYPT_SECRET=your_32_char_secret
EMAIL_ENCRYPT_SALT=your_32_char_salt

# AI Configuration
DEFAULT_LLMS=anthropic:claude-3-5-sonnet-20241022,openai:gpt-4o
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key

# Internal
INTERNAL_API_KEY=your_internal_api_key
INTERNAL_API_URL=http://web:3000
```

### 2. Deploy with Docker Compose

```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f web
```

### 3. Configure Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name vinbox.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name vinbox.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    location / {
        proxy_pass http://web:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket support for real-time features
    location /api/trpc {
        proxy_pass http://web:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Configure OAuth Providers

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Authorized redirect URI: `https://vinbox.yourdomain.com/api/auth/callback/google`
4. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`

#### Microsoft OAuth
1. Go to [Azure Portal](https://portal.azure.com/)
2. Register application in Azure AD
3. Redirect URI: `https://vinbox.yourdomain.com/api/auth/callback/microsoft`
5. Add `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET` to `.env`

#### Nylas (for IMAP/SMTP)
1. Create account at [Nylas Dashboard](https://dashboard.nylas.com/)
2. Create application with IMAP/SMTP provider
3. Webhook URL: `https://vinbox.yourdomain.com/api/nylas/webhook`
4. Add credentials to `.env`

### 5. Database Migrations

```bash
# Run migrations
docker compose exec web npx prisma migrate deploy --schema=apps/web/prisma/schema.prisma

# Or from host
docker compose run --rm web npx prisma migrate deploy
```

### 6. Set Up Cron Jobs

The cron service runs automatically in Docker Compose. Verify it's running:

```bash
docker compose logs cron
```

### 7. Health Checks

```bash
# Check web service
curl -f https://vinbox.yourdomain.com/api/health

# Check database
docker compose exec db pg_isready -U postgres

# Check Redis
docker compose exec redis redis-cli ping
```

## SSL Certificates

### Using Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d vinbox.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Using Custom Certificates

Place certificates in `/etc/nginx/ssl/` and update Nginx config.

## Backup and Restore

### Backup Database

```bash
# Create backup
docker compose exec db pg_dump -U postgres vinbox > backup_$(date +%Y%m%d).sql

# Compress
gzip backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
# Restore
gunzip -c backup_20240101.sql.gz | docker compose exec -T db psql -U postgres vinbox
```

### Backup Redis

```bash
docker compose exec redis redis-cli BGSAVE
docker cp $(docker compose ps -q redis):/data/dump.rdb ./redis_backup.rdb
```

## Scaling

### Horizontal Scaling (Web)

```yaml
# docker-compose.override.yml
services:
  web:
    deploy:
      replicas: 3
```

### Worker Scaling

```bash
# Run multiple workers
docker compose up -d --scale worker=3
```

## Monitoring

### Health Check Endpoints

- `GET /api/health` - Basic health check
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

### Logging

```bash
# View all logs
docker compose logs -f

# Specific service
docker compose logs -f web
docker compose logs -f worker
docker compose logs -f cron
```

### Metrics

Enable Prometheus metrics by adding to `.env`:

```env
NEXT_PUBLIC_METRICS_ENABLED=true
PROMETHEUS_ENDPOINT=/metrics
```

## Troubleshooting

### Common Issues

**Database connection refused**
```bash
# Check if DB is healthy
docker compose ps db
docker compose logs db
```

**Redis connection failed**
```bash
docker compose logs redis
docker compose exec redis redis-cli ping
```

**OAuth redirect mismatch**
- Verify redirect URIs in provider console match exactly
- Check `NEXT_PUBLIC_BASE_URL` matches your domain

**Email not sending**
```bash
# Check worker logs
docker compose logs worker

# Verify email config
docker compose exec web env | grep EMAIL
```

### Reset Everything

```bash
# Stop and remove all containers, volumes
docker compose down -v

# Restart fresh
docker compose up -d
```

## Upgrading

```bash
# Pull latest images
docker compose pull

# Rebuild and restart
docker compose up -d --build

# Run migrations
docker compose exec web npx prisma migrate deploy
```

## Security Checklist

- [ ] Strong `AUTH_SECRET` and `BETTER_AUTH_SECRET` (32+ chars)
- [ ] `AUTH_REQUIRE_ALLOWLIST=true` with `AUTH_ALLOWED_EMAILS`
- [ ] HTTPS enforced via reverse proxy
- [ ] Secure `EMAIL_ENCRYPT_SECRET` and `EMAIL_ENCRYPT_SALT`
- [ ] `NYLAS_WEBHOOK_SECRET` configured for webhook verification
- [ ] Database not exposed publicly (only internal network)
- [ ] Redis not exposed publicly
- [ ] Regular security updates: `docker compose pull && docker compose up -d`
- [ ] Backup strategy tested and documented
- [ ] Monitoring alerts configured

## Support

- Documentation: https://docs.getinboxzero.com (adapt for VINBOX)
- Issues: https://github.com/elasho9x/inbox-zero/issues
- Internal: Contact platform team