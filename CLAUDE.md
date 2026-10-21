# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**qtapp** — a personal "Quiet Time" (QT) Bible devotional and journaling app, live in production at https://qt.navigators.tech (The Navigators ministry). Built around the **PRESS** method (Pray, Read, Examine, Say it back, Share). Cut over from a ~3-year-old Nuxt 2 codebase to a full Nuxt 4 rewrite on 2026-07-23 — see `docs/migration-plan.md` for the full migration history and cutover runbook.

## Repo topology (important — two remotes, only one deploys)

- **`NavigatorsTech/DevoProject`** — the official org repo. **Its GitHub Actions (`.github/workflows/deploy.yml`) is what actually deploys to production**, with the real `SSH_HOST`/`SSH_USER`/`SSH_KEY`/`SSH_PORT` secrets. Pushing to its `master` triggers a real deploy.
- **`rogeryeosgit/DevoProject`** — where day-to-day development happens (this machine's `origin`). Treat it as the working/backup repo; changes need to be separately pushed/PR'd into `NavigatorsTech/DevoProject` to actually reach production. GitHub shows a fork relationship between the two (NavigatorsTech is technically a fork of rogeryeosgit), so a cross-repo compare/PR works via `https://github.com/NavigatorsTech/DevoProject/compare/master...rogeryeosgit:DevoProject:master`.

## Stack

- **Nuxt 4** (`^4.0.0`), **Vue 3**, SSR (`ssr: true`) — NOT React, NOT Nuxt 2 anymore.
- **Vuetify 3** (via `vuetify-nuxt-module`) for UI (Material Design). Styling is almost entirely Vuetify utility/component classes + theme colors in `nuxt.config.ts`; there is almost no custom CSS.
- **Pinia** for state (`stores/` dir, one module per namespace), **file-based routing** (`pages/` dir, Nuxt 4's `[param]` bracket syntax for dynamic routes — not the old `_param` underscore convention).
- Backend: **Nitro** (`server/api/**/*.{get,post,put,delete}.ts`, built into Nuxt 4 — no separate Express process anymore), **MongoDB Atlas** via **Mongoose 8**, **Firebase** auth (client SDK + `firebase-admin`), **ESV Bible API** for scripture cached via Nitro's `defineCachedFunction`.
- Vue 3 **Composition API** (`<script setup lang="ts">`) throughout. **TypeScript** is used for all server code and stores; components mix TS and plain JS depending on complexity. No class components, no Options API.

## Commands

- `npm run dev` — Nuxt dev server (`nuxt dev`), loads `.env` automatically (Nitro's built-in env loading, no `dotenv` package needed).
- `npm run build` — production build, emits `.output/` (Nitro) — NOT `.nuxt` (that was the old Nuxt 2 shape).
- `npm run start` — production server (`node .output/server/index.mjs`).
- `npm run generate` — static site generation.
- `npm run typecheck` — `nuxt typecheck`.

There are **no tests, no test framework, no linter/prettier config, and no CI test suite** (CI exists — see Deployment below — but it only builds and deploys, it doesn't run tests). Do not assume any of these exist. There is a one-off, read-only **data validation script** (`scripts/validate-data.mjs`) used during the migration to sanity-check production data against the new schema — not a general test suite. There's also `scripts/mobile-overflow-check.js`, a paste-into-DevTools-console snippet (not a Node script) for manually checking mobile-viewport overflow/wrap bugs — see its header comment for usage.

## Layout (Nuxt 4 conventions)

- `pages/` — routed views; each `.vue` is a route. Dynamic routes use bracket params: `journalList/[jid]/`, `plansList/[pid]/`.
- `components/` — reusable Vue SFCs (`Passage.vue`, `JournalCard.vue`, `PlanCard.vue`, `PlanEditor.vue`, `PassagePicker.vue` (book/chapter/verse picker, backed by `data/bible-books.json`), `QTJournalEditor.vue`, `StreakCard.vue`).
- `layouts/` — `default.vue` (app-bar + nav drawer). `error.vue` lives at the repo root (Nuxt 4 convention), not under `layouts/`.
- `middleware/` — route guards: `check-auth.ts` (rehydrates token from cookie into the Pinia user store), `login-check.ts` (redirects unauthenticated users). Attached per-page via `definePageMeta({ middleware: [...] })`.
- `stores/` — Pinia modules: `journal.ts`, `passage.ts`, `plan.ts`, `user.ts`. Access via `useJournalStore()` etc. (auto-imported composables), not `this.$store`.
- `composables/` — `useAuthFetch.ts` (`$fetch` wrapper that attaches the current user's Bearer token, with a 401-retry-once-then-logout backstop).
- `plugins/` — `firebase.client.ts` (initializes Firebase client SDK, syncs ID token refresh + a rolling 3-day idle-cap forced logout into cookies/Pinia — see its file comment for the exact mechanism).
- `server/` — Nitro backend:
  - `api/` — one file per REST endpoint (`plans/index.get.ts`, `qtJournalEntries/index.post.ts`, etc.), replacing the old single `router.js`.
  - `plugins/` — `mongo.ts`, `firebase-admin.ts` (boot-time initialization, Nitro's plugin convention).
  - `models/` — Mongoose models (`Plan.ts`, `QTEntry.ts`, `User.ts`).
  - `utils/` — `auth.ts` (`checkUser`/`requireOwner` — token verification + ownership checks), `bible-retrieval.ts` (ESV API + Nitro cache).
- `nuxt.config.ts` — central config: `runtimeConfig` (server secrets, **must** be supplied via `NUXT_`-prefixed env vars — see below), Vuetify theme (dark-mode-only), modules list.
- `docs/migration-plan.md` — the full Nuxt 2→4 migration history, decisions, and bugs found. `docs/dependency-upgrade-plan.md` — a separate, not-yet-started plan for bringing dependencies (and Node itself) up to current versions.

## Domain model

- **Passage** — a Bible passage fetched from the ESV API. Default fallback: "Proverbs [day-of-month]".
- **Plan** — a reading plan mapping dates → passages; `Plan.passages` is a nested Mongoose `Map` of `Map` (month → day → reference). New users get `"--- Default Nav Plan ---"`.
- **QTEntry** (journal entry) — title, thoughts, applicationImplication, date, passageReference. `thoughts` and `applicationImplication` are **encrypted at rest** via `mongoose-field-encryption` (`server/models/QTEntry.ts`).
- **User** — email + `planChosen` (currently selected plan id).

## API endpoints (`server/api/`)

- `GET /api/passages/today` (optional `?planID=`), `GET /api/passages?passageReference=`
- `POST /api/users/verify` (verifies a Firebase ID token, provisions a default-plan `User` doc on first login), `GET|POST /api/users/planChosen`
- `GET|POST|PUT|DELETE /api/plans` — auth-guarded via `checkUser`; PUT/DELETE also enforce `requireOwner` (only creator can edit/delete, 403 not 401 for non-owners).
- `GET|POST|PUT|DELETE /api/qtJournalEntries` — same auth/ownership pattern.

## Auth flow

Client sign-in/register from `pages/auth/index.vue` → Firebase client SDK directly (email/password or Google) → `plugins/firebase.client.ts`'s `onIdTokenChanged` listener syncs the token into cookies (`jwt`, `expirationTime`, `qtAppID`, `lastActiveAt`) and the Pinia user store. `composables/useAuthFetch.ts` attaches the Bearer token to API calls. Server verifies with `admin.auth().verifyIdToken()` (`server/utils/auth.ts`). A rolling 3-day idle cap force-logs-out if too much time passes between token refreshes — see the plugin's file comment.

## Environment & secrets

Required at runtime, all via `NUXT_`-prefixed env vars (Nitro's `runtimeConfig` convention — **bare names like `MONGODB_ACCESS` get silently baked in at build time and ignored at runtime**, a real bug found during migration): `NUXT_MONGODB_ACCESS`, `NUXT_ESV_API_KEY`, `NUXT_MONGOOSE_SECRET`, `NUXT_CACHE_TTL`. Also needs `fb-service-account.json` (Firebase Admin creds) at repo root — git-ignored. `.env` is loaded automatically by Nitro in dev, no `dotenv` package needed.

## Logging (`QTApp.log`)

The server writes **`logs/QTApp.log`** (`server/utils/logger.ts`, no logging dependency) — the successor of the Nuxt 2 app's log4js file, same line layout and old prefixes (`SERVER ROUTER:`, `AUTH:`, `BRService`, `DB Connector:`), plus `PASSAGE:` (today's passage silently fell back to Proverbs), `CLIENT:` (browser reports), `SLOW`, `PROCESS:` (crashes) and a daily `SUMMARY`. Lines also go to the console, so `npm run dev` and `pm2 logs qtapp` are unchanged.

- **Timestamps are always Singapore time** (`+08:00`), whatever the server's TZ.
- **One file per week** (Mon–Sun SGT): past weeks become `QTApp.<Monday>.log`, kept **365 days**, capped at 200 MB per file (then WARN+ only) and 5 GB in total (oldest deleted first).
- Settings: `NUXT_LOG_DIR` (default `logs`, relative to the working dir — production should point it outside the checkout, see `ecosystem.config.cjs.example`), `NUXT_LOG_LEVEL` (`info`; `debug` adds cache hits and stacks — dev only), `NUXT_LOG_RETENTION_DAYS`, `NUXT_LOG_MAX_FILE_MB`, `NUXT_LOG_MAX_TOTAL_MB`.
- **Error reference codes**: every request gets a 6-character code (`server/plugins/logging.ts`) that prefixes its log lines and comes back on failures as the `x-error-ref` header. Users see it as "Error ref: K7Q2XA" (`error.vue`, failure snackbars, via `errorRef`/`withErrorRef` in `composables/useAuthFetch.ts`); look it up with `grep K7Q2XA logs/QTApp*.log`.
- **One error hook logs every failed request** (5xx ERROR, 4xx WARN) — don't add per-handler try/catch just to log. 404s for routes that don't exist — pages or `/api` (vulnerability scanners probing `/.env`, `../` traversal, `/api/graphql`…) — are only counted, with the most-probed paths listed in the daily summary; Nuxt's own message for them embeds the full URL, so it's never logged. A handler's deliberate 404 ("Plan not found") is still logged.
- Browser problems: use `reportClientError(context, err)` / `reportClientEvent(...)` / `reportAuthFailure(...)` (`utils/reportClientError.ts`) instead of a bare `console.error`. They reach the log through the rate-limited `POST /api/client-log`.
- **Never log** tokens, request bodies, journal titles, `thoughts` or `applicationImplication` — identify entries by id. Logged paths keep only the `planID`/`passageReference` query params. User emails are fine (needed to diagnose auth).
- Hooks h3 calls outside the request's async context (`error`, `afterResponse`) must use `logger.forRef(event.context.ref)` to keep the code on their lines.

## Deployment

Self-hosted: PM2 process `qtapp` on the production server, nginx terminating TLS (existing Let's Encrypt cert) and reverse-proxying **plain HTTP** to `127.0.0.1:3000` — Nitro does not terminate its own TLS (the old Express app did; that's gone). PM2 config lives only on the server as `ecosystem.config.cjs` (never committed — holds secrets); `ecosystem.config.cjs.example` in this repo is the template.

**Two PM2/interpreter gotchas confirmed the hard way during the real cutover** (see `docs/migration-plan.md`'s "Cutover executed" note for the full story) — both already reflected in `ecosystem.config.cjs.example`:
- `interpreter` **must be an absolute path** to a Node 20+ binary (e.g. the nvm-installed one). A bare `'node'` string resolves against the PM2 daemon's own long-running environment, not whatever's on `PATH` when you run `pm2 start` — silently ran under the system's old Node and crashed.
- `exec_mode: 'fork'` with `instances: 1` is the confirmed-working combination on the production box; `'cluster'`/`'max'` did not honor the absolute interpreter path correctly there. Revisit only after confirming cluster mode respects it.

**PM2 only reads `ecosystem.config.cjs` when an app is *started from that file*.** `pm2 restart qtapp`, `pm2 start qtapp` (by name) and a reboot's resurrect all reuse the environment from the last start/`pm2 save` - after editing the file, run `pm2 delete qtapp && pm2 start ecosystem.config.cjs && pm2 save`. PM2 is installed under nvm on the server: load it first with `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24`, and never `sudo pm2` (root has a separate PM2).

CI (`NavigatorsTech/DevoProject`'s `.github/workflows/deploy.yml`, triggered on push to `master`): builds under Node 20 (via `actions/setup-node` for validation, `nvm` on the server for the actual restart), deploys via `git reset --hard origin/master` + `npm ci` + `npm run build` + PM2 delete/start from `ecosystem.config.cjs` + `pm2 save`, health-checks plain `http://127.0.0.1:3000/`, and rolls back on failure (verifying the rollback itself succeeded, not just attempting it).

## Conventions & gotchas

- Match existing style: Vue 3 Composition API (`<script setup>`), Vuetify 3 components, TypeScript on server/store code.
- No automated tests — verify changes by running `npm run dev` and exercising the flow manually. For anything touching auth/journal/plan flows, prefer testing against a throwaway Firebase test account over the user's own real account.
- `npm ci` requires `package-lock.json` to be in sync with `package.json` — if it drifts (e.g. from a stray `npm install` without committing the lock file), `npm ci` fails hard both locally and in CI. Regenerate with `npm install` and verify `npm ci` succeeds clean before committing.
