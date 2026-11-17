# VINBOX internal deployment

VINBOX is an internal fork of Inbox Zero. Keep the upstream `LICENSE` and notices. The license requires an enterprise agreement for organizations with five or more business users; confirm eligibility with Inbox Zero Inc. before that rollout.

## Release status

This branch is a development build. Do not connect production mailboxes or enable automatic sends until the Nylas webhook, periodic reconciliation, local mailbox sync, and browser QA gates in `VINBOX_DEVELOPMENT.md` are complete. The Nylas adapter deliberately rejects operations it does not yet support.

## Prepare the host

- Use a host capable of running Docker Compose, PostgreSQL, Redis, a long-running Node web process, and a worker. Ordinary shared hosting is unsuitable unless it supplies those services and persistent storage.
- Use Docker Compose 2.24.4 or newer for the `!override` entries in `docker-compose.vinbox.yml`.
- Keep TLS termination at a reverse proxy. Forward only `https://<your-internal-host>` to `127.0.0.1:3000`. Do not expose database or Redis ports outside the host.
- Set DNS, TLS, and an internal access policy before inviting staff. Keep the web host on an internal network or behind your identity-aware proxy.

## Configure

1. Make a private `apps/web/.env` based on `apps/web/.env.example`, then apply the VINBOX values in `.env.vinbox.example`. Never commit this file. Set `NEXT_PUBLIC_BASE_URL` to the exact HTTPS URL registered for authentication callbacks.
2. Set `AUTH_ALLOWED_EMAILS` or `AUTH_ALLOWED_EMAIL_DOMAINS` to approved staff and keep `AUTH_REQUIRE_ALLOWLIST=true`. Add the first administrator before opening access. Revoke any pre-existing sessions from accounts outside the new allowlist before rollout.
3. Keep Google and Microsoft credentials configured for their native account connections. Configure the Nylas v3 application in the selected US or EU region only for custom IMAP/SMTP accounts. Set `NYLAS_API_KEY`, `NYLAS_CLIENT_ID`, and `NYLAS_REGION` on the server. Register `https://<your-internal-host>/api/nylas/callback` as a Nylas redirect URI. The IMAP authorization flow requires SMTP. Never put the API key in any `NEXT_PUBLIC_` variable.
4. Set `NEXT_PUBLIC_NYLAS_ENABLED=true` in the Compose environment **before building** to show the custom IMAP button. Keep it false until the Nylas integration is approved for staff use.
5. Keep `AUTOMATION_SEND_ENABLED=false` until automated sending has a separate review and approval process. Manual composer sends still require a user action.
6. Set strong, distinct values for `POSTGRES_PASSWORD`, `REDIS_HTTP_TOKEN`, authentication secrets, encryption secrets, cron secret, and integration credentials. Place the Compose interpolation values in a private root `.env` or export them in the deployment environment. Restrict both private env files to the operator account.

The public brand name, icon URL, and Nylas button flag are compiled into the image. Changing them requires a rebuild. Server secrets are provided only at runtime. `docker-compose.vinbox.yml` overlays the upstream Compose file so `web` and `worker` use the locally built `vinbox:local` image instead of the upstream registry image.

## Build and start a staging instance

```sh
docker compose -f docker-compose.yml -f docker-compose.vinbox.yml --profile all --profile queue-worker config
docker compose -f docker-compose.yml -f docker-compose.vinbox.yml --profile all --profile queue-worker build web
docker compose -f docker-compose.yml -f docker-compose.vinbox.yml --profile all --profile queue-worker up -d
```

Review the rendered `config` output privately because it includes secrets. Do not paste it into tickets or logs. Confirm that `web`, `worker`, `cron`, PostgreSQL, Redis, and the Redis HTTP bridge are healthy. The included override binds web traffic to loopback for the reverse proxy.

Apply migrations only after a verified backup and a staging rehearsal. The web startup script may apply pending migrations, so inspect the release's Prisma migrations before starting a new image against a production database.

## Backup and restore

Stop writes or use PostgreSQL's consistent dump tools while the application is running. Back up both PostgreSQL and the Redis volume, plus the private environment files and reverse-proxy configuration, into encrypted storage. Keep backups outside the Docker host. Test restore on a separate staging host before a release.

For a logical PostgreSQL backup with this Compose stack:

```sh
docker compose -f docker-compose.yml -f docker-compose.vinbox.yml exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > vinbox-postgres.dump
```

Restore only into a fresh, isolated staging database with matching application and migration versions. Verify account ownership, encrypted integration data, and mailbox views before switching any traffic. Never apply a destructive migration or overwrite the production database as a restore test.

## Release checklist

- Confirm license eligibility, attribution, staff allowlist, administrator role, and session revocation.
- Test Gmail and Microsoft native connections alongside Nylas IMAP in staging. Confirm account-qualified thread IDs, account source labels, search, folder operations, drafts, attachments, reply threading, and idempotent sending.
- Verify webhook HMAC validation, replay deduplication, known-grant scoping, periodic reconciliation, and recovery after worker restarts.
- Run focused unit and browser tests, inspect generated desktop and mobile screenshots, and complete the production build.
- Verify the reverse proxy, TLS, backups, restore rehearsal, migration plan, secrets, logs, worker, and scheduled jobs.
- Leave automatic sending disabled unless the organization explicitly enables it after reviewing its safeguards.

Do not publish or deploy this branch until every gate above is complete.
