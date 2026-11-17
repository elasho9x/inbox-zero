# VINBOX on a single VPS (Docker Compose)

Runbook for the internal demo deployment on the AWS `t3.small` box
(`52.63.240.146`, Ubuntu 24.04). Everything below runs on the VPS; the Mac is
only used to copy the working tree over SSH.

## Topology

```
https://vinbox.serverdnsnet.com  (Caddy :80/:443, Let's Encrypt)
        └─> web:3000        (vinbox:local image, Next.js standalone)
              ├─> db:5432           (postgres:16, named volume)
              ├─> redis:6379        (redis:7)
              └─> serverless-redis-http:80
worker: vinbox:local (profile queue-worker)
cron: alpine (background HTTP cron loop)
```

The published web port is bound to `127.0.0.1:${WEB_PORT}` only; all public
traffic enters through Caddy.

## Prerequisites already applied once

```bash
# Docker Engine + Compose plugin (official apt repo)
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu   # re-login afterwards

# 8 GB swap: `next build` sets NODE_OPTIONS=--max_old_space_size=8192 and the
# box only has 1.9 GiB of RAM.
sudo fallocate -l 8G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Environment

Two files, both untracked and `chmod 600`:

* `~/vinbox/.env` — interpolated by Compose:

  ```env
  POSTGRES_PASSWORD=<random>
  REDIS_HTTP_TOKEN=<random>
  NEXT_PUBLIC_BASE_URL=https://vinbox.serverdnsnet.com
  WEB_PORT=18080
  NEXT_PUBLIC_BYPASS_PREMIUM_CHECKS=true   # demo: skip billing gating
  NEXT_PUBLIC_NYLAS_ENABLED=false
  ```

* `~/vinbox/apps/web/.env` — read by the Next.js container (Compose
  `INBOX_ZERO_ENV_FILE` default). Must contain every variable `apps/web/env.ts`
  requires without a default:

  ```env
  DATABASE_URL=postgresql://postgres:<pw>@db:5432/vinbox?schema=public
  DIRECT_URL=postgresql://postgres:<pw>@db:5432/vinbox?schema=public
  NEXT_PUBLIC_BASE_URL=https://vinbox.serverdnsnet.com
  AUTH_SECRET=<random 32+ chars>
  BETTER_AUTH_SECRET=<random 32+ chars>
  AUTH_REQUIRE_ALLOWLIST=true
  AUTH_ALLOWED_EMAILS=<your google address>
  GOOGLE_CLIENT_ID=<google client id>
  GOOGLE_CLIENT_SECRET=<google client secret>
  GOOGLE_PUBSUB_TOPIC_NAME=vinbox-demo
  EMAIL_ENCRYPT_SECRET=<random>
  EMAIL_ENCRYPT_SALT=<random>
  INTERNAL_API_KEY=<random>
  REDIS_HTTP_URL=http://serverless-redis-http:80
  AUTOMATION_SEND_ENABLED=false
  ```

Google Cloud setup for sign-in: enable the **Gmail API**, leave the OAuth
consent screen in **Testing** and add the allowlisted address as a test user,
then register these authorized redirect URIs:

* `https://vinbox.serverdnsnet.com/api/auth/callback/google`
* `https://vinbox.serverdnsnet.com/api/auth/oauth2/callback/google`

## Build and run

```bash
cd ~/vinbox
# ~1-3 h on 2 vCPU with swap; run with plain progress so it can be watched.
docker compose -f docker-compose.yml -f docker-compose.vinbox.yml \
  --profile all build web

docker compose -f docker-compose.yml -f docker-compose.vinbox.yml \
  --profile all --profile queue-worker up -d

docker compose -f docker-compose.yml -f docker-compose.vinbox.yml logs -f web
```

`docker/scripts/start.sh` runs `prisma migrate deploy` before starting
`node apps/web/server.js`; watch for `✅ Database migrations completed` and
`Starting server…`.

## HTTPS entry point

```bash
docker network ls | grep vinbox          # -> vinbox_vinbox-network
docker run -d --name vinbox-caddy --restart unless-stopped \
  --network vinbox_vinbox-network \
  -p 80:80 -p 443:443 \
  -v ~/vinbox/deploy/Caddyfile:/etc/caddy/Caddyfile:ro \
  -v caddy_data:/data -v caddy_config:/config \
  caddy:2
docker logs -f vinbox-caddy              # wait for certificate issuance
```

`vinbox.serverdnsnet.com` is public DNS that resolves to `52.63.240.146`, so
Let's Encrypt can issue a real certificate without owning a domain.

## Verification

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' https://vinbox.serverdnsnet.com/login
curl -fsS https://vinbox.serverdnsnet.com/api/health
curl -fsS https://vinbox.serverdnsnet.com/login | grep -o VINBOX | head -1
docker ps --format 'table {{.Names}}\t{{.Status}}'
```

## Operations

* **Update**: `git pull`, then rebuild the image and `up -d --build`.
* **Logs**: `docker compose ... logs -f web worker`.
* **Restart**: `docker compose ... restart web`.
* **Backup**: `docker exec <db-container> pg_dump -U postgres vinbox > backup.sql`.
* **Tear down**: `docker compose -f docker-compose.yml -f docker-compose.vinbox.yml down`
  (add `-v` to drop the database volume).
* **Rotate Google secret**: edit `apps/web/.env`, `docker compose ... up -d web`.

## Known limitations of this demo box

* 2 vCPU / 1.9 GiB: builds are slow and the runtime has little headroom; the
  8 GB swap file is load-bearing.
* No LLM API key configured, so AI features stay idle until one is added
  (`OPENAI_API_KEY` / `ANTHROPIC_API_KEY` + `DEFAULT_LLMS`).
* `NEXT_PUBLIC_BYPASS_PREMIUM_CHECKS=true` is convenient for a demo and **must
  be flipped to `false`** before any real internal rollout.
