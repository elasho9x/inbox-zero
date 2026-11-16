# VINBOX — internal email workspace

## Product decisions
- Product name: **VINBOX** (uppercase); internal-use application for the user's team.
- Base: fork of Inbox Zero. Keep original license notices and attribution.
- The app must retain its native Gmail and Microsoft Graph connections.
- Add **Nylas only when a provider/feature is unsupported**. Target custom IMAP/SMTP accounts hosted on cPanel, Plesk, and DirectAdmin, plus compatible providers not supported natively.
- One responsive mailbox interface with an All Accounts view, per-account views, advanced search, threads, folders, drafts, sending, attachments, rules, and AI assistant.
- No Nylas credentials in the browser, URLs, Git history, logs, or browser storage.
- No production mailbox or Nylas traffic until configured by an administrator.
- Use PostgreSQL and Redis as already provided by the upstream project. Deployment should support Docker behind a reverse proxy; do not claim ordinary shared hosting is suitable without validating Node, workers, and persistent services.

## Branding
- Set `NEXT_PUBLIC_BRAND_NAME=VINBOX` and `NEXT_PUBLIC_SLACK_BOT_NAME=VINBOX`; keep all interface labels consistently branded.
- Replace generic upstream visuals with a VINBOX wordmark/icon (without deleting legally required attribution).
- Internal-only login: use allowlisted staff email addresses or domains, with administrator-controlled account provisioning and role permissions. Disable public signups and public marketing analytics in the production internal deployment.
- Review metadata, OpenGraph, PWA, favicons, desktop app, email templates, notification emails, Slack/Telegram names, and settings.
- No invented customer-facing marketing, prices, usage figures, or VNET support email.

## Provider design
1. Preserve existing `GmailProvider` and `OutlookProvider` code for Google/Microsoft.
2. Add a Nylas provider implementing the existing `EmailProvider` contract *or a smaller provider-neutral core with capability checks if required*. The existing contract is extensive; do not stub unsupported methods as successes.
3. Store mapping from internal `EmailAccount.id` to Nylas `grant_id` per owner. Prevent cross-account access by deriving the grant from authenticated server-side data rather than accepting it from user-supplied request parameters.
4. Use Nylas v3 in the configured US/EU region, with server-side API key. Encrypt integration secrets; handle disconnected grants, failed refresh, permissions, Nylas errors, rate limiting, and retry/backoff.
5. First implement connection onboarding, list/read/thread/search, folders, unread/starred, and attachments. Then implement drafts/reply/send with correct threading and idempotency. Then complete AI action, rule, sync, and webhook compatibility.
6. Webhooks must be validated, deduplicated, scoped to known grants, and reconciled by periodic sync, with resilient cursor persistence. Never log message bodies or secrets.
7. Each email's UI must show its actual mailbox/source, and sending must require a deliberate user action. AI drafting is allowed, but auto-send should default off and require a separate opt-in and safeguards.
8. Merge per-account message pages into one chronological All Accounts view with stable account-qualified IDs, folder mapping, sorting, and pagination. Keep provider IDs separate.

## Security and quality gates
- Respect existing permission middleware, schema conventions, `AGENTS.md`, and upstream architecture.
- Validate connection inputs; never expose a generic unauthenticated Nylas proxy.
- Protect against cross-account IDOR, webhook spoofing/replay, HTML/script injection from email, duplicate sends, and background-worker job races.
- Add unit tests (including failure paths), provider emulator/fixture tests, and real-browser tests for desktop and mobile. Preserve existing Gmail/Outlook regressions.
- Use staged migrations and release documentation. Never enable dangerous migrations on production without a backup.

## Codex implementation sequence
- **P0:** Audit existing provider model, branding, licensing, config, sync, migrations, and test conventions. Prepare an implementation checklist with file paths.
- **P1:** Complete consistent VINBOX identity, staff-only security defaults, login/metadata/icons and visual responsiveness.
- **P2:** Implement the Nylas provider and account connection lifecycle; prefer native providers when available. Document exact credential setup without committing values.
- **P3:** Build and validate all-account unified inbox with provider-aware search, correct pagination, threads, folders, attachments, replies, and drafts.
- **P4:** Preserve/extend AI triage, drafts, automation, Slack/Telegram. Require user approval for sending or destructive actions by default.
- **P5:** Verify security, tests, builds, self-host production compose/proxy config, setup guide, data backup/restore, and release checklist.

## Licensing checkpoint
The upstream repository's LICENSE adds a commercial-monetization restriction and requires an enterprise license for organizations with five or more business users. Internal use does not automatically waive that requirement. Confirm license eligibility with Inbox Zero Inc. before rolling out to a team of 5+ and before removing/editing any attribution. This document does not grant additional rights.

## Existing Nylas starter
A separate proof-of-concept ZIP was created in the ChatGPT conversation. It is **not** a complete production adapter. Codex should review its approach only if made available in the workspace, verify current Nylas v3 docs, and write native TypeScript integration and tests in the monorepo.

## Definition of done
VINBOX starts from its own deployable build; branding is consistent; Gmail/Outlook remain working; a custom IMAP account can be connected via Nylas, read, searched, replied to, and managed; unified inbox handles multiple providers; tests cover permissions, errors, and sending; credentials never appear in UI or logs; operator documentation is complete.
