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

## Real desktop and mobile applications (required)

This requirement is for installable, functional apps, **not promotional images or mockups**. The same VINBOX backend, account permissions, and provider integrations must power web, desktop, iOS, and Android.

### Desktop — reuse the existing Electron app in `apps/desktop`
- Rename application name, About menus, executable/installers, app ID, deep-link protocol (`vinbox://`), native notifications, desktop diagnostics and update messages, tray/Dock label, stored app session partition, and Windows App User Model ID to VINBOX.
- Replace `apps/desktop/build/icon.png` with actual VINBOX icon artwork from a user-approved asset. Make generated .icns/.ico/PWA icons as appropriate and maintain accessible contrast.
- Update server's `DESKTOP_AUTH_ORIGIN=vinbox://`, desktop `VINBOX_APP_URL` (or compatible legacy env), custom-scheme OAuth callbacks, state/PKCE verification, and allowlisted origins.
- Ship independently installable signed macOS DMG/ZIP (Intel and Apple Silicon) and Windows installers (x64/ARM64 where toolchains support them). Linux is optional after Windows/macOS.
- Switch release publisher, update feed, CI workflows, artifact filenames, release notes and download links to VINBOX-owned resources. Never allow VINBOX clients to auto-install upstream Inbox Zero releases.
- Preserve multiple windows, unread badge, privacy-safe native notifications, offline local cache, app restart state, and native desktop keyboard shortcuts.
- Before packaging, run Electron typecheck, tests and actual install/login/uninstall smoke tests on macOS and Windows. Sign/notarize with credentials provided privately by the administrator.

### Android — VINBOX Android application
- The upstream README mentions an older React Native Android app, but its source is **not in this repository**. Do not pretend a rebrandable Android project exists here.
- First verify whether a separately licensed or public upstream Android source repository exists and can be legally reused. Otherwise implement a VINBOX-branded Android app under `apps/mobile` (React Native/Expo, or another practical solution validated against the backend).
- Match full core UX: account switcher, unified inbox, read/search, threads, reply/forward, drafts, attachments, push notifications, AI summaries/drafts, user settings.
- Use VINBOX Android application ID (proposed `com.vnetindia.vinbox`; verify available package ID), launcher icons, splash, lock screen notification privacy, secure local token storage, deep/app links, and responsive layouts.
- Implement OAuth via system browser and PKCE, not embedded browser password collection. Ensure logout revokes the session and clears local email data. Allow administrator configuration of the private VINBOX server URL without exposing credentials.
- Produce installable APK for internal distribution and signed AAB when Play Store distribution is later approved.

### iOS/iPadOS — build VINBOX app from permitted source
- Upstream README explicitly says its Swift iOS app is **not open source**. A build with its branding cannot be produced just by forking this repo. Do not use the existing App Store app as a VINBOX-branded app or copy unavailable source.
- Build a separate VINBOX iOS app using a suitable supported framework (prefer sharing Android code where practical) and integrate the backend's existing mobile authentication endpoints.
- Use VINBOX app name, bundle identifier (proposed `com.vnetindia.vinbox`), icons/splash, secure Keychain storage, universal links/custom scheme registration, privacy-safe notifications, account handling, accessibility, and native navigation behavior.
- Prepare signed iOS IPA and TestFlight/internal distribution when Apple signing and provisioning credentials are supplied privately. Require Apple Developer account and suitable provisioning.
- iPhone and iPad should get layouts appropriate to screen size, rather than a desktop page squeezed into a webview.

### Shared app API and credentials
- Respect the upstream `/api/mobile-auth/*` PKCE implementation; adapt server callback origins for VINBOX and test both desktop and mobile flows end-to-end.
- All mailbox grants stay server-side, including Nylas. The mobile and desktop apps call authenticated VINBOX APIs, never store Nylas API keys.
- Do not assume the web app's internal server actions can be safely called by native apps without a proper authenticated API surface. Build only the required, access-controlled endpoints.
- Keep AI destructive actions and sends approval-gated by default. Synchronize account state across platforms while protecting sensitive local caches.
- Ensure release/signing settings don't publish to third-party or upstream update endpoints.
- Maintain and document platform-specific build pipelines, test fixtures, emulator tests, store/privacy disclosures where applicable, and internal distribution instructions.

### Done when
- VINBOX Web works on mobile/desktop browsers.
- VINBOX Desktop for macOS and Windows actually installs, logs into the VINBOX server, reads and sends mail, and updates from a VINBOX-controlled feed.
- VINBOX Android APK installs, securely signs in, syncs mail, and handles notifications.
- VINBOX iOS build launches on a physical iPhone, securely signs in, syncs mail, and handles notifications.
- Each app displays VINBOX branding and uses the same connected mailbox data without requiring separate Nylas grants.
