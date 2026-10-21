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
- **Code review** and **GitHub:** 0 open issues; 9 Dependabot PRs (#47, #49–#56); 2 unpushed local commits
  (`d114caa` Mongo bound to localhost, `4ed8505` npm audit fix: 31 → 15 advisories).

**Overall theme:** the board's 5 "In progress" cards, all untouched since Feb 2025, describe a **redesign**: a
personalised home page, a profile page, and better plan and journal views. Most Notion ideas fit inside that
redesign. So the plan is: clear the urgent items (Phase 0), fix correctness and security (Phase 1), then do the
redesign as the main release (Phase 2), with a backlog after that.

Workflow (unchanged): develop on `rogeryeosgit/DevoProject` on this box, then PR into `NavigatorsTech/DevoProject`.
A merge there deploys to production.

---

## Phase 0: This week

1. **Extend the reading plan's passages** (Notion task due 31 Oct)
   - `docker/mongo-init.js` seeds `"--- Default Nav Plan ---"` only through **Jul 2026**. If production stops there
     too, every visitor has had the `Proverbs <day>` fallback since August (`server/api/passages/today.get.ts`).
   - Step 1: a read-only check of which months production's default plan covers. Roger runs it, since it needs the
     production database credentials.
   - Step 2: add **`scripts/import-plan.mjs`**:
     - Reads a CSV of `date,reference`.
     - Validates each reference against `data/bible-books.json`, the same data `PassagePicker.vue` uses.
     - `$set`s `passages.<MMM YYYY>.<D>` (e.g. `passages.Jul 2026.15`, the format `server/models/Plan.ts` uses)
       on the chosen plan.
     - Has `--dry-run`, and reads `NUXT_MONGODB_ACCESS` from `.env` or `ecosystem.config.cjs`.

     This also covers the board card **"input plans using csv"**, as a command-line tool for now.
   - Step 3: update `docker/mongo-init.js` to match.
2. **Fix the open bug: "Verification emails / Firebase emails always go to spam"** (board, Bugs column)
   - This is configuration, not code. In the Firebase console (Authentication → Templates), set up a
     **custom sender domain**, e.g. `noreply@navigators.tech`. Add the SPF/DKIM DNS records Firebase gives you to
     navigators.tech, and customise the template text. Optionally, send through your own SMTP provider instead.
   - Check with mail-tester.com, plus a Gmail and an Outlook inbox.
3. **Ship and tidy up**
   - Push `d114caa` and `4ed8505`.
   - Close the Dependabot PRs that `4ed8505` already covers (vite 8.3.4, undici, devalue, svgo, shell-quote,
     busboy, brace-expansion, source-map-js, postcss-selector-parser); merge any it doesn't.
   - Record the 4th CVE wave and the 15 remaining advisories in `docs/dependency-upgrade-plan.md`.
   - **Board housekeeping** (Roger, or me once the token has the `project` write scope):
     - Merge the 3 duplicate "On User deletion" cards.
     - Close cards that only applied to Nuxt 2: "connections not closed" (Nitro uses a single pooled connection in
       `server/plugins/mongo.ts`) and "minimize package size for vendor app" (webpack-era).
     - Add the Notion ideas as cards.
4. **Cutover leftovers** (`docs/migration-plan.md` L764–816; on the production server, with Roger)
   - Retire the `qtapp-v4test` PM2 process, the `qt-v4test` nginx site and `~/QTNuxtProject-v4-test`.
   - Close ufw port 8443, and drop `devoProjDB_v4test` in the Atlas dashboard.
   - Rotate the **ESV API key**.
   - The Mongoose secret that was shown belonged to the **test** config. First confirm it's different from
     production's. If it is, rotating it is harmless. If it's the same, it needs a re-encrypt migration (Phase 4).
   - Reset the one dangling `planChosen` to the default plan.
   - Confirm the hand-built Atlas indexes exist.
   - Add `ecosystem.config.cjs` to `.gitignore`.
   - Turn on Dependabot alerts on `NavigatorsTech/DevoProject`.

## Phase 1: Correctness, security and developer hygiene

**Board "To do" items that are really bugs or integrity issues:**
- **Deleting a plan leaves its users dangling.** In `server/api/plans/index.delete.ts`, before deleting, reset every
  `User` with `planChosen == planID` back to the default plan. This is the likely cause of the production data issue.
- **No success/failure feedback on plan pages.** `stores/plan.ts` create/update/delete swallow errors with
  `console.error`, and `journal.ts` deleteEntry does the same.
  - Have them return success/failure.
  - Callers `await` them before navigating away (`createPlan/index.vue:24-30`, `[pid]/index.vue:58-66`, the
    `[jid]` delete).
  - Add one shared `composables/useSnackbar.ts` to replace the 5 copied snackbar blocks.
- **Verse continuity in plan creation.** PassagePicker should require the second verse to come after the first.
  Also fix: Cancel should revert the passage, a day's passage should be clearable, and PlanEditor month keys depend
  on timezone (`PlanEditor.vue:183,220,235`).
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
  `routeRules` or `nuxt-security`, after checking what nginx already sends.
- **Bound `tokenCache`** in `server/utils/auth.ts`; `await` and catch `mongoose.connect`; make an ESV outage fail
  gracefully.
- **Firebase:**
  - Restrict the web API key to the qt.navigators.tech referrer in Google Cloud console.
  - Trim Authorized Domains.
  - Optionally add App Check.
- ✅ **Done (Oct 2026, branch `feat/qtapp-logging`): "Log failed login attempts" (board) and structured logs.**
  `logs/QTApp.log` is back, with weekly files kept a year and Singapore timestamps. It logs failed sign-ins
  (through the rate-limited `/api/client-log`), browser errors, error reference codes users can quote, silent
  passage fallbacks, ESV/Mongo problems, slow requests and crashes. See the "Logging" section in `CLAUDE.md`.
  - Still to check in production: the MongoDB `disconnected`/`reconnected` lines (couldn't stop Docker here
    without sudo) and the 3-day idle-cap forced-logout report (needs a real 3-day-idle session).
  - Found while testing: `/plansList/<id>` fetches the plan **twice** during SSR (two API calls per page load).
- Still open: add a **`/api/health`** endpoint that pings Mongo, and point `deploy.yml`'s health check at it,
  since `/` returns 200 even when the database is down.

**Developer hygiene** (worth doing before the redesign, so UI work has a safety net):
- Add a PR CI workflow `.github/workflows/ci.yml` running `npm ci`, `build`, `typecheck` and
  `audit --audit-level=critical`.
- Turn `typeCheck` on (`nuxt.config.ts:162`) and type the `any` store state.
- Add `.github/dependabot.yml`.
- Fix the stale docs:
  - README local setup is still Express/HTTPS with bare env names.
  - CLAUDE.md still says Node 20, doesn't mention email verification, and is missing endpoints.
  - `scripts/validate-data.mjs` still uses `.js` and the non-`NUXT_` names.
- Small fixes: `vite.optimizeDeps.include`, `prefixComposables` (for the `useLayout` warning), and Docker
  `mongo:6` → `mongo:8`.

## Phase 2: The redesign (board "In progress": the main v2.1 release)

**Start with the Vuetify 3 → 4 upgrade** (dependency-upgrade-plan Phase 3). It means a visual-regression hunt
across every page anyway, so doing it at the start of a redesign avoids doing the visual work twice.
Then start with a short **design pass**: mockups of the home, profile, journal list and plan pages for Roger to
approve before building.

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
- **Every change:** `npm ci && npm run build`, and `typecheck` once Phase 1 turns it on. After Phase 1, CI runs these
  on every PR.
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
- **Release:** PR into NavigatorsTech; `deploy.yml` validates, deploys and health-checks; smoke test on
  qt.navigators.tech.

## Questions for Roger
1. Where does the 2026–27 passage list come from, and does production really stop at Jul 2026?
2. Redesign direction: keep it dark-only, or add a light theme? Should I prepare mockups first?
3. Account deletion: what happens to plans the user created that others use? Transfer them to the default
   owner, keep them as anonymous, or delete them?
4. Can the GitHub token get the `project` (write) scope, so I can update the board as work lands?
