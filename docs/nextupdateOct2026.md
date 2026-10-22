# QT App (DevoProject): plan for the next stage

## Context
Roger wants the next round of improvements for **qtapp** (Nuxt 4, live at qt.navigators.tech). The Nuxt 2 → 4
cutover on 2026-07-23 took 76 commits in July. Since then it's been maintenance only.

**Sources reviewed:**
- **GitHub project board "Devo Project Project Board"** (users/rogeryeosgit/projects/2), 59 draft cards:
  29 Done, 24 To do, **5 In progress**, **1 Bug**. This is the main backlog; Roger says it's the most up to date.
- **Repo docs:** `CLAUDE.md`, `README.md`, `docs/migration-plan.md`, `docs/dependency-upgrade-plan.md`, `docs/Notes.md`.
- **Notion:** the QT App wishlist (on the "Projects" page), Mrs Yeun's ideas (on the "NavTech" page), QT-sharing goals
  (on "Servant Team"), and the task **"Update QT passages", due 2026-10-31**.
- **Code review** and **GitHub** (at the time: 0 open issues, 9 Dependabot PRs, 2 unpushed commits).

**Status (22 Oct 2026):**
- **Done and deployed 21 Oct** (PRs #57 and #58 into NavigatorsTech): `QTApp.log` logging (weekly files, SGT
  timestamps, error reference codes, browser/sign-in reports, SLOW-request breakdowns), the typecheck fix, the
  Logout menu duplicate-ID fix, the npm audit update (31 → 15 advisories), Mongo bound to localhost, the local seed
  plan refresh (Jun 2020 – Oct 2026), `pm2 save` in `deploy.yml`, and production `NUXT_LOG_DIR`.
- **On `rogeryeosgit` master, not deployed yet:** the scanner-404 noise fix (`2a69d66`).
- **Most urgent:** production's default reading plan **ends 31 Oct 2026** (see Phase 0.1).

**Overall theme:** the board's 5 "In progress" cards, all untouched since Feb 2025, describe a **redesign**: a
personalised home page, a profile page, and better plan and journal views. Most Notion ideas fit inside that
redesign. So the plan is: clear the urgent items (Phase 0), fix correctness and security (Phase 1), then do the
redesign as the main release (Phase 2), with a backlog after that.

Workflow: commit straight to `master` on `rogeryeosgit/DevoProject` (no feature branches unless Roger asks), then
open a PR from `rogeryeosgit:master` into `NavigatorsTech/DevoProject`. Merging that PR deploys to production.

---

## Phase 0: This week

1. **Extend the reading plan's passages: deadline 31 Oct** (Notion task "Update QT passages")
   - ✅ Checked 21 Oct: production's `"--- Default Nav Plan ---"` covers **Jun 2020 – Oct 2026**. From **1 Nov** every
     visitor gets the `Proverbs <day>` fallback (`server/api/passages/today.get.ts`). `QTApp.log` will show a
     `PASSAGE: … has no passage …` WARN line from that day.
   - Still needed: the passage list for **Nov 2026 onwards** (see question 1).
   - Load it through the plan editor UI, or add **`scripts/import-plan.mjs`**:
     - Reads a CSV of `date,reference`.
     - Validates each reference against `data/bible-books.json`, the same data `PassagePicker.vue` uses.
     - `$set`s `passages.<MMM YYYY>.<D>` (e.g. `passages.Jul 2026.15`, the format `server/models/Plan.ts` uses)
       on the chosen plan.
     - Has `--dry-run`, and reads `NUXT_MONGODB_ACCESS` from `.env` or `ecosystem.config.cjs`.

     This also covers the board card **"input plans using csv"**, as a command-line tool for now.
   - Then regenerate `docker/mongo-init.js` from production with the same export/import steps as 21 Oct (✅ done
     once, for Jun 2020 – Oct 2026), so a fresh local database matches.
2. **Fix the open bug: "Verification emails / Firebase emails always go to spam"** (board, Bugs column)
   - This is configuration, not code. In the Firebase console (Authentication → Templates), set up a
     **custom sender domain**, e.g. `noreply@navigators.tech`. Add the SPF/DKIM DNS records Firebase gives you to
     navigators.tech, and customise the template text. Optionally, send through your own SMTP provider instead.
   - Check with mail-tester.com, plus a Gmail and an Outlook inbox.
3. **Ship and tidy up**
   - ✅ Pushed and deployed. ✅ All Dependabot PRs are closed: #47 (svgo) was obsolete, and the rest closed themselves
     once `4ed8505` was on master.
   - Remaining security alerts (4), none fixable today:
     - `@grpc/grpc-js` (high + low): Firebase's Firestore package pins `~1.9.0`, and the fix is 1.13.6. **Decision
       (21 Oct): wait for Firebase's own update**, no `overrides` entry. The app never loads Firestore, so the
       vulnerable code never runs.
     - `braces`, `node-forge` (high): no fixed release yet. Both are Nuxt build/dev tooling.
   - ✅ The 4th CVE wave and these alerts are recorded in `docs/dependency-upgrade-plan.md` (Phase 0, "Update 2026-10-21").
   - **Board housekeeping** (Roger, or me once the token has `project` write scope; it currently has read-only
     `read:project`):
     - Merge the 3 duplicate "On User deletion" cards.
     - Close cards that only applied to Nuxt 2: "connections not closed" (Nitro uses a single pooled connection in
       `server/plugins/mongo.ts`) and "minimize package size for vendor app" (webpack-era).
     - Add the Notion ideas as cards.
4. **Production server housekeeping** (`docs/migration-plan.md` L764–816 cutover leftovers, plus 21 Oct findings)
   - ✅ `NUXT_LOG_DIR=/home/roger/qtapp-logs` set, and `deploy.yml` now runs `pm2 save` after every restart.
   - Move the leftover `/QTNuxtProject/logs/QTApp.log` (written before the setting took effect) into
     `/home/roger/qtapp-logs/`.
   - `chmod 600 ~/.pm2/dump.pm2`: it holds every env value in plain text, including the database connection string
     and the encryption secret.
   - The deploy user's PM2 now runs only `qtapp` (seen in the 21 Oct deploy log), so the `qtapp-v4test` process looks
     gone. Still retire the `qt-v4test` nginx site and `~/QTNuxtProject-v4-test`.
   - Close ufw port 8443, and drop `devoProjDB_v4test` in the Atlas dashboard.
   - Rotate the **ESV API key**.
   - The Mongoose secret that was shown belonged to the **test** config. First confirm it's different from
     production's. If it is, rotating it is harmless. If it's the same, it needs a re-encrypt migration (Phase 4).
   - Reset the one dangling `planChosen` to the default plan.
   - Confirm the hand-built Atlas indexes exist.
   - ✅ `ecosystem.config.cjs` is in `.gitignore`.
   - Turn on Dependabot alerts on `NavigatorsTech/DevoProject`.

## Phase 1: Correctness, security and developer hygiene

**Board "To do" items that are really bugs or integrity issues:**
- ✅ **Deleting a plan leaves its users dangling** (Round A1, `321ab1d`, 22 Oct). `DELETE /api/plans` now moves
  users who had chosen the plan to the default plan, and refuses to delete the default plan itself. The one existing
  dangling `planChosen` in production still needs the one-off reset in Phase 0.4.
- **Plans named like the default (found 22 Oct).** Any user can create a plan called `--- Default Nav Plan ---`, and
  the app finds the default plan *by name*, so a duplicate could be picked instead. Long-term fix: an `isDefault`
  flag on the Plan model (already suggested in `docs/migration-plan.md`).
- **No success/failure feedback on plan pages.** `stores/plan.ts` create/update/delete swallow errors with
  `console.error`, and `journal.ts` deleteEntry does the same.
  - Have them return success/failure.
  - Callers `await` them before navigating away (`createPlan/index.vue:24-30`, `[pid]/index.vue:58-66`, the
    `[jid]` delete).
  - Add one shared `composables/useSnackbar.ts` to replace the 5 copied snackbar blocks.
- **Verse continuity in plan creation.** PassagePicker should require the second verse to come after the first.
  Also fix: Cancel should revert the passage, a day's passage should be clearable, and PlanEditor month keys depend
  on timezone (`PlanEditor.vue:183,220,235`).
- ~~`/plansList/<id>` fetches the plan twice~~ **Not a bug (checked 22 Oct, Round A2 dropped).** Normal loads
  fetch it once. The second request only appears after a **500**: `ofetch` (under `$fetch`) automatically retries a
  failed GET once for 408/409/425/429/500/502/503/504 (`node_modules/ofetch`, `retryStatusCodes`). The 500s seen were
  malformed IDs, which D1 turns into 404s, and those aren't retried.
- **Logged-in flash for stale sessions (low priority).** If a browser still has the login cookies but no Firebase
  session, the page server-renders logged in, then the client logs out during hydration. The result is Vue hydration
  mismatch warnings and a brief logged-in view (seen 21 Oct with cookie-only sessions). Possible fix: render the
  auth-dependent parts client-only, or clear the cookies before mount when Firebase reports no user.
- **Android keyboard regression check.** `auto-grow` is back on `QTJournalEditor.vue:28`, which a Done card had
  removed because the keyboard covered the textarea. Test on a real Android phone, and fix it (cap rows, or
  `scrollIntoView` on focus) if the problem is back.

**"Check APIs for vulnerabilities" and "Firebase security" (board):**
- **Input validation:** add `zod` and use `readValidatedBody`/`getValidatedQuery` in each `server/api` handler.
  - Malformed ObjectIds return 400/404 instead of 500.
  - Cap `limit` in `qtJournalEntries/index.get.ts`.
  - Validate `passageReference`.
  - In `planChosen.post.ts`, check the plan exists.
- **Server-set entry dates:** `qtJournalEntries/index.post.ts` currently trusts the client's `date`. The server
  should set it, using the client's timezone offset. This fixes entries made after midnight landing on the wrong day,
  and stops streaks being gamed with backdated entries.
- **Rate limiting** on the public `/api/passages/today` (nginx `limit_req`). **Security headers/CSP**, via
  `routeRules` or `nuxt-security`. Confirmed 21 Oct: live responses (through Cloudflare) carry **no** HSTS, CSP,
  `X-Frame-Options` or `X-Content-Type-Options`.
- **Bound `tokenCache`** in `server/utils/auth.ts`; `await` and catch `mongoose.connect`; make an ESV outage fail
  gracefully.
- **Firebase:**
  - Restrict the web API key to the qt.navigators.tech referrer in Google Cloud console.
  - Trim Authorized Domains.
  - Optionally add App Check.
- ✅ **Done (21 Oct, PRs #57/#58, plus `2a69d66` on master): "Log failed login attempts" (board) and structured logs.**
  `logs/QTApp.log` is back, with weekly files kept a year and Singapore timestamps. It logs failed sign-ins
  (through the rate-limited `/api/client-log`), browser errors, error reference codes users can quote, silent
  passage fallbacks, ESV/Mongo problems, slow requests and crashes. See the "Logging" section in `CLAUDE.md`.
  - Still to check in production: the MongoDB `disconnected`/`reconnected` lines (couldn't stop Docker here
    without sudo) and the 3-day idle-cap forced-logout report (needs a real 3-day-idle session).
  - Scanner probes (`/.env`, `../` traversal, `/api/graphql`…) are only counted in the daily summary. 21 Oct check:
    they can't read `.env`, `fb-service-account.json` or `ecosystem.config.cjs`; the live site and the app both
    return 404/400.
- ✅ **`/api/health`** (Round A3, `b8a0339`): 200 when MongoDB answers a ping, 503 plus a `HEALTH:` log line when it
  doesn't. ✅ `deploy.yml` health-checks it (Round A4, `5a8443c`): retried for about 30s, with a fallback to `/` for
  older versions during a rollback.

**Developer hygiene** (worth doing before the redesign, so UI work has a safety net):
- Add a CI workflow `.github/workflows/ci.yml` on push to `master` (work goes straight to master now) running
  `npm ci`, `build`, `typecheck` and `audit --audit-level=critical`. `npm run typecheck` is clean again since
  `7cfdac8`, so it can go in from day one. Today only the deploy workflow builds, and it doesn't typecheck.
- Turn `typeCheck` on (`nuxt.config.ts`) and type the `any` store state.
- Dependabot: keep **alerts** on, but don't merge its PRs. Apply updates by hand instead (Roger, 21 Oct: keeps the
  contributor list clean). Optionally turn off "Dependabot security updates" in the repo settings. No
  `dependabot.yml`.
- Fix the stale docs:
  - README local setup is still Express/HTTPS with bare env names (only its new "Logs" section is current).
  - CLAUDE.md still says Node 20 in the Deployment/CI text, doesn't mention email verification, and is missing
    endpoints (`/api/client-log` is now one more).
  - `scripts/validate-data.mjs` still uses `.js` and the non-`NUXT_` names.
- Small fixes: `vite.optimizeDeps.include`, `prefixComposables` (for the `useLayout` warning), and Docker
  `mongo:6` → `mongo:8`.

## Phase 2: The redesign (board "In progress": the main v2.1 release)

**Start with the Vuetify 3 → 4 upgrade** (dependency-upgrade-plan Phase 3). It means a visual-regression hunt
across every page anyway, so doing it at the start of a redesign avoids doing the visual work twice.
Then start with a short **design pass**: mockups of the home, profile, journal list and plan pages for Roger to
approve before building. New UI code should report failures with `reportClientError` / `withErrorRef` (see
"Logging" in CLAUDE.md), so problems reach `QTApp.log` with a reference code users can quote.

| Area | Board card(s) | Contents (Notion ideas folded in) |
|---|---|---|
| **Personalised home** (`pages/index.vue`) | "Personalize front page after sign in", "BEAUTIFY… overview on the landing page" | Today's passage with **← previous / next day →** (board, user-requested); streak plus **milestone stars** (Mrs Yeun); **PRESS prompt questions** to help beginners get started (Mrs Yeun, Bryan); a **"Your past applications"** card for the same passage or one year ago (Notion; new owner-scoped endpoint, decrypting only `applicationImplication`); a "Write today's QT" button. Logged out: reading-first, no login needed (Notion: "people want to read on arrival"). |
| **Profile page** (new `pages/profile/`) | "Create a profile page…" | Font-size and colour preferences (add a light theme; the app is dark-only today); streak and progress charts; **download my journal** (board) as JSON/Markdown export; **delete my account** (the board's user-deletion cards): deletes entries and the Firebase user, and resolves owned plans (see question 3). |
| **Journal list** (`pages/journalList/`) | "Redesign viewing of journal entries…", "search through journal entries" | Group by month, with filters. **Search:** `thoughts`/`applicationImplication` are encrypted, so the server can only search `title`/`passageReference`. Full-text search over decrypted text would have to run in the browser across loaded pages. Start with title and passage search. |
| **Plans** (`pages/plansList/`) | "Redesign… present details of plan" | A calendar/month view instead of the long table; a picker that scales to 10–20 plans (Notion); fewer clicks from month to day. |
| **Small wins** | "sharing…" (Done, but clipboard only) | After login, **go straight to writing** (Notion). Upgrade Share to `navigator.share()` (opens the WhatsApp/Telegram share sheet) with a clipboard fallback. Double-tap to collapse the passage card (board). |

## Phase 3: Backlog (board "To do", larger or exploratory; pick case by case)
- **Journal entries without a passage** (ETWG, prayer list): make `passageReference` optional, plus an entry `type`
  on the QTEntry model.
- **Other Bible versions** (board and Notion): licensing first (api.bible etc.), then a `version` preference on User.
- **Dictionary / Greek Strong's tooltips**, and **links/articles for devotions**: needs a content source; a spike.
- **Highlight-to-quote while journalling**: select passage text to insert a quote into the editor.
- **"Get in touch" feedback form**: an email or Notion/Sheet relay.
- **AI ideas** (keyword summaries over time, mood-matched images): journals are private and encrypted, so this would
  have to be opt-in, decrypt only for that user, and come with an explicit privacy note. Treat it as its own design
  decision.
- **Ministry stats** ("% of NavTech doing QT", Notion): needs groups and consent-based aggregates. Later.

## Phase 4: Platform upgrades (staging + backup first)
- Mongoose 9, and `mongoose-field-encryption` (unmaintained) or a replacement AES-GCM helper. Do these with a
  re-encrypt migration if the secret needs rotating.
- Gate every step on the updated `validate-data.mjs` and an encrypt/decrypt round trip on a copy of the Atlas data.
- Node 26 LTS (out ~28 Oct): wait until early 2027, and update the interpreter path in `ecosystem.config.cjs`.
- TypeScript 7 once Volar supports it.

---

## Verification
- **Local, on this box:** Docker Mongo plus `npm run dev`, viewed through `ssh -L 3000:localhost:3000`. Always use a
  **throwaway account in the `navtech-dev-apps` Firebase project** (CLAUDE.md), never Roger's real account.
- **Every change:** `npm ci && npm run build && npm run typecheck`. Once Phase 1 adds CI, it runs these on every push
  to `master`.
- **Diagnostics:** `logs/QTApp.log` (SLOW breakdowns, error reference codes, CLIENT reports). For logged-in flows, a
  throwaway `navtech-dev-apps` user signed in through a firebase-admin custom token, driven with headless Chrome
  (`/usr/bin/google-chrome` on this box), worked well on 21 Oct. Delete the user afterwards.
- **Phase 0:** review the `import-plan.mjs --dry-run` output with Roger. Afterwards, `/api/passages/today` returns
  the planned passage, not Proverbs. Check spam placement for verification and reset emails with mail-tester.
- **Phase 1:**
  - curl checks: a bad ObjectId returns 400/404; `limit` is capped; rapid requests are rate-limited; `/api/health`
    fails with Mongo stopped; a backdated entry gets the server's date.
  - Deleting a plan moves its users to the default plan.
  - Android keyboard test on a real phone.
- **Phase 2:**
  - Page-by-page visual check at mobile and desktop widths (`scripts/mobile-overflow-check.js`).
  - Previous/next day navigation.
  - The export downloads every entry decrypted.
  - Account deletion removes Mongo data and the Firebase user.
  - `navigator.share` on a real phone.
- **Release:** PR from `rogeryeosgit:master` into NavigatorsTech. `deploy.yml` validates, deploys, health-checks and
  `pm2 save`s. Then smoke-test qt.navigators.tech and check `/home/roger/qtapp-logs/QTApp.log` for the new
  `Server started (qtapp …+<commit>)` line.

## Questions for Roger
1. Where does the passage list for **Nov 2026 onwards** come from? (Production's plan ends Oct 2026, confirmed
   21 Oct.)
2. Redesign direction: keep it dark-only, or add a light theme? Should I prepare mockups first?
3. Account deletion: what happens to plans the user created that others use? Transfer them to the default
   owner, keep them as anonymous, or delete them?
4. Can the GitHub token get `project` (write) scope, so I can update the board as work lands? (It has read-only
   `read:project` now.)
