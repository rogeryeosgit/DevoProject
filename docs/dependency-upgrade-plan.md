# Upgrade dependencies to latest + move to Node 24 LTS

## Context

`qtapp`'s `nuxt4-migration` branch (Nuxt 4 / Vue 3 / Vuetify 3 / Pinia / Nitro) has drifted behind
upstream on most of its dependencies, and `npm audit` currently reports 12 moderate-severity
vulnerabilities. Separately, CI and the production deploy script are still pinned to Node 20,
which went fully end-of-life on 2026-04-30. The goal of this plan is to bring every dependency up
to its latest safe version, close the known CVEs, and move the app onto a current Node LTS line —
without introducing the kind of silent regressions a live journaling app storing encrypted
personal data can't afford.

**This plan assumes the `nuxt4-migration` branch has already been merged to `master` and cut over
to production.** It is a follow-on project, not something to run concurrently with that migration
— stacking two large changes on one branch makes it much harder to isolate what broke if something
does. `docs/migration-plan.md` remains the source of truth for that prior migration; this plan
starts from a stable post-cutover baseline. **Note:** `FEATURES.md` (the parity-QA checklist
`migration-plan.md` references throughout as "§11") was deleted in `0b209ae` on 2026-07-26 —
before this doc's most recent updates, so every "`FEATURES.md` §11" reference below is stale.
There is no standalone QA checklist doc anymore; manual verification for this plan means
exercising the app's core flows directly (see CLAUDE.md's Domain model / API endpoints sections
for what those are: auth, plan CRUD, journal CRUD, today's-passage retrieval) against
https://qt.navigators.tech, per CLAUDE.md's general "no automated tests" guidance.

**Definition of done:** `npm audit` reports zero known vulnerabilities, every dependency in
`package.json` is on its latest stable (non-RC, non-experimental) version compatible with this
app, CI/deploy/production all run Node 24, and every core flow (auth, plans, journal entries,
today's passage) still passes manual QA against the upgraded build.

**Maintenance note:** a clean `npm audit` is a point-in-time result, not a finish line — the
`brace-expansion` wave (see Phase 0) hit an already-"done" tree just days after Phase 0 landed. Expect
to re-run `npm audit` and re-check the `overrides` block periodically, not just once. Also: Dependabot
alerts are only enabled on the `rogeryeosgit/DevoProject` remote (0 open as of 2026-07-29) — alerts are
disabled entirely on `NavigatorsTech/DevoProject`, so the org repo will never surface them itself.

---

## Working process (how this plan is executed)

- This plan is a **living document**: the Progress checklist below is updated (boxes ticked, notes
  added) after every completed phase, the same way `docs/migration-plan.md` was maintained during
  the Nuxt 4 migration.
- **Before starting each phase, inspect the repo** to confirm the previous phase actually landed
  (dependency versions, `npm audit` output, build passes) — don't assume from memory.
- **Commit after each phase** that builds cleanly and passes manual QA. Do not commit a broken
  build. Do the higher-risk phases (3) on their own commit(s), separate from the low-risk batch
  (Phase 1), so a revert doesn't have to take back everything at once.
- No automated test suite exists (per `CLAUDE.md`) — verification at every phase is `npm run dev`
  plus manually exercising the core flows (auth, plan CRUD, journal CRUD, today's-passage
  retrieval), compared against the live app at https://qt.navigators.tech where relevant.

## Progress checklist

- [x] **Phase 0** — Immediate CVE fixes + Node baseline (no breaking changes) — **done 2026-07-24**
  - Add an `overrides` block to `package.json`:
    - `esbuild: ^0.28.1` — fixes GHSA-67mh-4wv8-2f99 (dev-server-only CORS issue, pulled in via
      `vuetify-nuxt-module` → `unconfig` → `importx`'s nested esbuild copy). Every other consumer
      (Vite, Nitro, tsx) already dedupes to a patched esbuild; this just collapses the one stray
      duplicate rather than requiring the `vuetify-nuxt-module@1.0.0-rc.3` bump `npm audit`
      suggests.
    - `uuid: ^11.1.1` — fixes GHSA-w5hq-g745-h8pq (buffer bounds check). **Note:** bumping
      `firebase-admin` to 14.x does *not* actually resolve this on its own — confirmed by
      installing it fresh and re-running `npm audit`; `@google-cloud/storage`'s `gaxios`/
      `teeny-request` chain still pins a vulnerable `uuid` regardless of firebase-admin version.
      The override is the real fix.
  - Re-run `npm audit` and confirm 0 vulnerabilities remain.
  - ~~Move Node target from 20 (EOL 2026-04-30) to **24 "Krypton"** (current Active LTS until
    2026-10-28, when Node 26 leaves Current and becomes LTS — do not adopt 26 before then)~~
    **Done, landed independently of the CVE-override sub-item above (that one's still open):**
    - `.github/workflows/deploy.yml`: `actions/setup-node@v4` `node-version: '20'` → `'24'` ✓
    - Same file's SSH deploy script: `nvm use 20` → `nvm use 24` ✓
    - `ecosystem.config.cjs.example`: interpreter path + comments updated to Node 24 ✓
    - Added `"engines": { "node": ">=24" }` to `package.json` ✓
    - Production server: Node 24.18.0 installed via nvm, live `qtapp` process moved over
      (`pm2 describe` confirms `node.js version: 24.18.0`, `fork_mode`, 0 restarts) ✓
  - **Done:** `overrides` block landed (`esbuild: ^0.28.1`, `uuid: ^11.1.1`). `npm audit` confirmed
    **0 vulnerabilities** (was 12 moderate). `npm run build` verified clean under Node 24.
  - **Update 2026-07-2x (`e833d62`):** a fresh `npm audit` a few days after Phase 0 landed surfaced a
    new wave of **13 high-severity** advisories, all tracing to one transitive package:
    `brace-expansion <=5.0.7` (unbounded-expansion DoS), pulled in via the `nitropack`/`archiver`
    chain. `npm audit fix --force`'s own suggested fix was to **downgrade `nuxt` to 4.1.3** to dodge
    it — a regression, not a fix. Added a third override instead — `brace-expansion: ^5.0.8` — which
    cleared every alert without touching `nuxt`. Verified `npm ci`, `typecheck`, and `build` all
    succeed clean afterward. Current overrides block: `esbuild ^0.28.1`, `uuid ^11.1.1`,
    `brace-expansion ^5.0.8` — `npm audit` still reports 0 vulnerabilities as of 2026-07-29.
  - **Update 2026-08-12:** a routine `npm audit` (prompted by a request to check what needed
    updating) surfaced a third wave — **7 vulnerabilities: 1 critical, 4 high, 2 moderate**.
    Confirms the "point-in-time, not a finish line" warning above yet again. Breakdown:
    `@nuxt/devtools <3.3.1` (critical — unauthenticated dev-server RPC arbitrary command
    execution), `nuxt 4.0.0-4.5.0` (high — 7 advisories, all pulled in transitively via
    `@nuxt/vite-builder`/`undici`/`nanoid`/`postcss`), and `brace-expansion 4.0.0-5.0.8` (high —
    the Phase 0 override's floor was overtaken by a new advisory, `GHSA-rgw5-rvv9-x895`). Of the
    7 Nuxt advisories, 5 concern Server Islands (not used anywhere in this app — no
    `*.server.vue`, no `<NuxtIsland>`, no `componentIslands` config) and 1 concerns mixed-case
    `routeRules` (low exposure here — only one lowercase rule exists, at `nuxt.config.ts:124`,
    and auth gating goes through `definePageMeta` middleware, not route rules). The one that
    matters: `GHSA-wm8w-6qjm-cv43`, the runtime payload cache disclosing one user's SSR data to
    another — real exposure for an SSR app serving per-user journal entries. **Resolution:**
    bumped `nuxt` `^4.5.0` -> `^4.5.2` (closes 6 of 7 on its own -- 4.5.2 pins
    `@nuxt/devtools ^3.4.1`, `undici ^8.10.0`, `@nuxt/vite-builder 4.5.2` which pulls patched
    `postcss`/`nanoid`) and the `brace-expansion` override `^5.0.8` -> `^5.0.9`. Also picked up
    the in-range minor/patch drift sitting in the lockfile: `vuetify` 3.12.10 -> 3.13.1,
    `firebase` 12.16.0 -> 12.17.1, `mongoose` 8.24.1 -> 8.24.3, `vue` 3.5.40 -> 3.5.41, `vue-tsc`
    3.3.8 -> 3.3.9, `@vue/devtools-api` 8.1.5 -> 8.2.1 -- all still v3/v8-line, none of the
    deferred majors below. An incremental `npm install` hit a `rolldown` peer-dependency
    ERESOLVE (nuxt 4.5.2's peer range `~1.2.1` conflicting with the existing resolved graph,
    despite `1.2.3` satisfying that range) -- resolved with a full
    `rm -rf node_modules package-lock.json && npm install` rather than
    `--force`/`--legacy-peer-deps`. Verified `npm audit` (0 vulnerabilities), `npm run typecheck`
    (0 errors), and `npm run build` (clean `.output/`) all succeed afterward.

- [x] **Phase 1** — Low-risk dependency bumps (batch together) — **done 2026-07-24**
  - `nuxt` 4.4.8 → 4.5.0 (minor) ✓
  - `pinia` 3.0.4 → 4.0.2 **and** `@pinia/nuxt` 0.11.3 → 1.0.1 together ✓, `@vue/devtools-api`
    added as an explicit dependency (`^8.1.5`) ✓
  - `vue-router` 4.6.4 → 5.2.0 ✓ — peers confirmed satisfied (vite 8.1.5, vue 3.5.40, pinia 4)
  - `vuetify-nuxt-module` 0.18.9 → 0.19.5 ✓ (not the `1.0.0-rc.3` `latest` tag). Introduces a
    harmless `useLayout` auto-import collision warning at dev/build time (Nuxt's built-in wins;
    app code doesn't call `useLayout` anywhere) — cosmetic, not a bug.
  - `nuxt-gtag` 3.0.3 → 4.1.0 ✓
  - `vue-tsc` 2.2.12 → 3.3.8 ✓ (also fixes the `vue-router/volar/sfc-route-blocks` plugin-load
    warning `npm run typecheck` was emitting)
  - **`typescript` correction:** the "latest 6.x" instruction above was wrong — **there is no
    stable TypeScript 6.x**. Registry dist-tags show `6.0.0-beta` (beta only) and `latest: 7.0.2`.
    Left on `^5.7.0` (installed 5.9.3) pending TS 7.1 Vue/Volar support (~Oct 2026).
  - **Pulled forward from Phase 2** (re-assessed as low-risk after confirming the app is Auth-only,
    no Firestore/Storage/Messaging/Instance ID usage): `firebase` (client) 11.10.0 → 12.16.0 ✓,
    `firebase-admin` 13.10.0 → 14.2.0 ✓.
  - Verify: `npm run build` ✓, `npm run typecheck` (0 errors) ✓, `npm run dev` boot + manual smoke
    test (`/` and `/auth` render 200 SSR) ✓. Full core-flow QA (auth, plans, journal CRUD) still
    recommended before this reaches production, but blocked locally on this dev machine's Mongo
    Atlas/ESV API credentials (unrelated to this upgrade — flagged separately).

- [ ] **Phase 2** — Medium-risk bumps
  - `mongoose` 8.24.1 → 9.8.0 — requires Node ≥20.19 (satisfied by Phase 0). Codebase inventory
    (2026-07-24) confirms **no hand-written `.pre()`/`.post()` hooks anywhere** — the only Mongoose
    middleware is internal to `mongoose-field-encryption` (see Phase 3), so the v9 callback-`next()`
    removal doesn't touch app code directly. No removed v9 APIs in use either (no callback queries,
    `update()`, `remove()`, `count()`). The real risk is entirely the encryption plugin's Mongoose-9
    compatibility — see Phase 3. `Plan.passages` nested `Map`-of-`Map` schema (`server/models/Plan.ts`)
    still needs a manual regression test regardless.
  - Verify: full plans + journal CRUD flows, especially multi-month plan create/edit round-trips.

- [ ] **Phase 3** — High-risk bumps (isolate on their own commit(s), extra QA)
  - `vuetify` 3.12.10 → 4.1.5 — the largest single item. Real breaking changes: CSS reset mostly
    removed, typography renamed MD2→MD3 (`text-h1` → `text-display-large`, etc.), elevation levels
    25→6, shrunk default breakpoints, `VBtn` uppercase removed, `VForm`/`VSelect` slot-prop
    changes. Since styling here is almost entirely Vuetify utility/component classes (per
    `CLAUDE.md`), expect the same kind of multi-round visual-regression hunt the Vuetify 2→3
    migration already went through (see `docs/migration-plan.md` Phase 5 notes). Migrate
    incrementally using Vuetify's official revert-snippets/codemods; reuse the existing
    parity-QA process from the Nuxt 4 migration (page-by-page comparison against prod) rather
    than inventing a new one.
  - `mongoose-field-encryption` 3.1.0 → 7.0.1 — highest-stakes item: encrypts journal entry text
    at rest, and the package is unmaintained (last published mid-2023, predates Mongoose 9
    entirely). The AES-256-CBC `salt:ciphertext` format is unchanged across all four majors and
    includes legacy-decrypt fallback, but Mongoose-9 compatibility is unverified upstream.
    **Do not deploy this without a staging round-trip test** (encrypt → save → read → decrypt
    against real `QTEntry`-shaped data) and a DB backup/rollback path ready first.
  - `firebase-admin` 13.10.0 → 14.2.0 — requires Node ≥22 (covered by Phase 0's Node 24 target).
    Drops the deprecated Instance ID service and legacy FCM types — confirm neither is used
    (they aren't, as of the current Nitro backend). Does **not** resolve the uuid CVE on its own
    (already fixed in Phase 0 via override).
  - Verify: full manual walkthrough of every core flow end to end, plus a dedicated journal
    encrypt/save/read/decrypt round-trip check in staging before this phase touches production
    data.

- [ ] **Phase 4** — Deferred (not part of this pass; revisit later)
  - Node 26 once it reaches Active LTS (~2026-10-28)
  - `vuetify-nuxt-module` 1.0.0 and TypeScript 7.x once Vue/Volar tooling officially supports them
    (~TS 7.1, similar timeframe)

## MongoDB server upgrades (why they don't move these dependencies)

Checked 2026-07-29 after the user upgraded the Atlas database and asked what needed to change here.
**Short answer: nothing.** The intuitive assumption — "new database version ⇒ bump Mongoose" — doesn't
hold for this app, and it's worth recording why so this doesn't get re-derived (or worse, mistakenly
tangled up with the Phase 3 encryption-plugin risk) next time.

- **You never bump the MongoDB driver directly — Mongoose pins it.** `mongoose` 8.24.1 pins
  `mongodb: ~6.20.0` (installed 6.20.0), which brings `bson` 6.10.4 and `mongodb-connection-string-url`
  3.0.2 along with it. A CVE in any of those three is a `package.json` `overrides` entry, same pattern
  as `esbuild`/`uuid`/`brace-expansion` above — not a reason to touch `mongoose` itself.
- **Mongoose 8.24.1 already covers every MongoDB server version that exists.** Per Mongoose's official
  compatibility table, Mongoose 8.x supports server 8.x (requires `^8.7.0`, satisfied). The newest
  MongoDB server release is 8.2.x — there is no server 9.0. So an Atlas upgrade to any
  currently-available version needs no dependency change at all.
- **The app's DB usage is plain CRUD**, which keeps it out of the version-sensitive parts of the
  driver/server contract. Grepped `server/` for transactions/sessions, CSFLE, aggregation pipelines,
  change streams, Atlas Search, and time-series — none are used. Only `findOne`, `find`, `create`,
  `save`, `deleteOne`, `findOneAndUpdate`.
- **`mongoose-field-encryption` is unaffected by a server upgrade.** It does application-side
  AES-256-CBC encryption *before* the write reaches the driver — it is not MongoDB's CSFLE/Queryable
  Encryption, so it has no server-version coupling whatsoever. Its only real risk (see Phase 3) is
  compatibility with a future **Mongoose 9** bump, which is a separate, still-deferred decision — a
  database version bump does not trigger it.
- **Only Mongoose 9 itself would ever move the driver** — it pins `mongodb: ~7.5` (min Node 20.19,
  satisfied by the Node 24 baseline). That stays gated on Phase 2/3 exactly as written above: it's
  blocked on validating `mongoose-field-encryption` against Mongoose 9 in staging, not on anything
  related to the database server version.
