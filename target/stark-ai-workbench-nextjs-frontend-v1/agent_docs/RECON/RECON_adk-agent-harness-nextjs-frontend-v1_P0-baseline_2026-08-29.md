# RECON REPORT — adk-agent-harness-nextjs-frontend-v1 · P0 baseline

> **Run type:** Full stark-recon (Day-0 sweep + Sections 1–13 of `RECON_MISSION.md`) plus
> four Operator-added capture requirements (A2A/Hermes wiring · session-state residency ·
> artifact/file-transport paths · exact versions + env-var NAMES). Ordered by the Operator
> against the current working tree of branch `bim-005` (HEAD `41fda97` + uncommitted work).
> **Date:** 2026-08-29 12:04 +06.
> **Verifier:** Claudy (Engineer). Read-only of codebase; read-only git queries only; the
> only write is this file. `git status --short` before and after the run is byte-identical.
> **Skill:** stark-recon v1.1 (`_SKILLS/stark-recon-skill-v1.1/`). Label legend:
> EVIDENCE / INFERENCE / CLAIM / GAP / QUESTION.
>
> **Two protocol notes.** (1) The Operator's prompt named `RECON_QUESTIONNAIRE.md`; the
> skill's payload file is `templates/RECON_MISSION.md` — that is what was executed.
> (2) The prompt said `agent_docs/recon/` (lowercase). The repo's established convention is
> uppercase `agent_docs/RECON/` (two prior reports live there; `session_2026-07-26.md:100`
> records "UPPERCASE — operator convention"). Written to the uppercase folder; no lowercase
> folder was created.

---

## HEADLINE

1. **THE BOARD IS RED: 10 suites / 38 tests failing (26 / 225 pass; 36 / 263 total).**
   Root cause is a single uncommitted edit dated **2026-08-26** to
   `config/agents.manifest.json` that swapped the agent roster
   (`greeting/jarvis/calc/product/ghl/moose` → `architect/hermes/designer/devops/ghl`).
   Every mock file, Mission Control's hardcoded list, and 28 test files still use the OLD
   names, so `/api/agent/*` now answers **400 "Unknown agent"** to its own tests.
   RECOVERY.md's "36/263 green" claim is **stale** — the tree has changed since the 07-26 park.
   `tsc --noEmit` exit 0 · `next build` clean (24 routes). Type-check and build did not catch
   it because agent names left the type system at BIM-003 (`AgentName = string`).
2. **A2A / Hermes workers 9901/9902/9903: ZERO code, ZERO docs, ZERO deps in this repo.**
   The only "hermes" token anywhere is the manifest entry `hermes_agent` (label typo
   "Harmes Main Agent"), mapped to ADK bundle `v1` like every other agent. There is no
   agent-card, no `.well-known`, no port 99xx, no A2A client dependency. The repo speaks one
   protocol: ADK `api_server` REST (`/apps/{app}/users/{u}/sessions/{s}` + `/run`).
3. **Session state lives in four places with four different lifetimes** — transcripts
   upstream in ADK's session store (not this repo; survival unknown), the session INDEX in
   Supabase `chat_sessions` (durable), the active-session pointer + selected agent in
   browser `localStorage` (`adk-session-map-live|mock`; durable per-browser), and message
   content in Zustand memory (lost on reload). The Next.js server holds **no** session state.
4. **File/artifact transport: none, and none partial.** `AttachmentMenu` is two
   `console.info` stubs with no handler wired from `ChatPageContent`; the ADK connector sends
   text-only parts and drops every non-text part on read. The only object I/O in the repo is
   the GCS instructions text file (BIM-005).
5. **Uncommitted FIX-003 is still uncommitted 40 days on** (8 modified + 7 untracked files,
   exactly as the 07-26 park described) — plus the three new Aug-26 edits (manifest, a
   `config/agents.manifest copy.json` snapshot of the OLD roster, and three portal links
   commented out of `NavbarHome.tsx`), none of which appear in any session log, CHANGELOG, or
   RESPONSES artifact.

---

## Day-0 Ground-Truth Sweep (Section 0)

### S0.0 — Git / tree state
- **EVIDENCE:** `git branch --list` → `* bim-005` (others: `bim-001`, `bim-002`, `bim-002-1`,
  `bim-002-2`, `bim-003`, `bim-004`, `ffm-with-mock-data`, `main`, `single-chat-agents`).
  HEAD `41fda97 Merge branch 'bim-004' into bim-005` (2026-07-20 19:10 +06). No stash.
- **EVIDENCE:** `git diff --stat` → 10 tracked files modified (171+/19−); 7 untracked paths.
  Identical list before and after this recon's build/tsc/jest runs.
- **EVIDENCE (post-park activity):** `find -newer session_2026-07-26.md` → `.env.local`,
  `next-env.d.ts`, `config/agents.manifest.json`, `config/agents.manifest copy.json`,
  `src/components/global/NavbarHome.tsx` (all dated 2026-08-26). `.next/` dated 07-27.
  → **Someone worked on this tree on Aug 26 without a session file.** No
  `session_2026-08-26.md`, no CHANGELOG entry, no RESPONSES artifact.
- **EVIDENCE:** `git diff config/agents.manifest.json` — removed `greeting_agent`,
  `jarvis_agent`, `calc_agent`, `product_agent`, `moose_mcp_agent`; added `architect_agent`,
  `hermes_agent` ("Harmes Main Agent" — typo), `designer_agent`, `devops_agent`;
  `ghl_mcp_agent` retained. Bundles unchanged (`v1` → `ADK_BUNDLE_URL_V1`,
  `v2-local` → `ADK_BUNDLE_URL_V2_LOCAL`).
- **EVIDENCE:** `diff config/agents.manifest.json "config/agents.manifest copy.json"` → the
  copy holds the OLD six-agent roster (the committed one). The copy is untracked and NOT
  loaded by anything (`src/config/manifest.ts:14` imports `agents.manifest.json` only).
- **EVIDENCE:** `git diff src/components/global/NavbarHome.tsx` → the three portal
  `<NavLink>`s (members/admin/superadmin) are commented out. Not mentioned in any doc.
- **CLAIM (RECOVERY.md:9-10, session_2026-07-26.md:18):** "36 suites / 263 green". See S0.5 —
  **FALSE as of today**.

### S0.1 — Handbook-named files exist on disk
Checked against the files the architecture cheat-sheet (`session_2026-07-26.md` §"Where
everything lives" + §"Architecture cheat-sheet") and BIM docs name:
- **EVIDENCE (present):** `src/services/chatService.ts`, `src/services/sessionIndexService.ts`,
  `src/services/instructionsService.ts`, `src/services/profileService.ts`,
  `src/services/index.ts`, `src/app/api/agent/_lib/adk.ts`, `src/app/api/agent/run/route.ts`,
  `src/app/api/agent/history/route.ts`, `src/app/api/agent/instructions/route.ts`,
  `src/app/api/agent/instructions/_lib/gcsInstructions.ts`, `src/config/manifest.ts`,
  `config/agents.manifest.json`, `src/store/chatStore.ts`, `src/store/useAuthStore.ts`,
  `src/components/chat/SessionPanel.tsx`, `src/components/chat/AgentSwitcher.tsx`,
  `src/utils/speech.ts`, `src/utils/app-role.ts`, `src/proxy.ts`,
  `supabase/setup.sql`, `supabase/chat_sessions_setup.sql`, every
  `agent_docs/CURRENT_APP/<MODULE>/ACCEPTANCE_SPEC.md` for BIM003/004/005/FIX003.
- **GAP:** Factory doc set is **three of four** —
  `agent_docs/CURRENT_APP/app-factory-frontend-first-module/_project/{APP_BRIEF,DATA_CONTRACT,UI_SPEC}.md`
  exist; **`FILE_TREE.md` does not** (`ls` → no such file). Project CLAUDE.md's "read
  FILE_TREE.md" instruction has nothing to read.
- **GAP:** `reference/` folder (CLAUDE.md: "When a reference/ folder exists…") → absent.

### S0.2 — Handbook-claimed exports/shapes vs disk
- **EVIDENCE (match):** `useChatStore` persist `partialize` → `{ agentSessions, selectedAgent }`
  only (`src/store/chatStore.ts:211-214`); key `adk-session-map-${mode}` (`:37-39`);
  `useHydrationReady()` exported (`:227`). Matches FIX-003 docs.
- **EVIDENCE (match):** `resolveBundleEnvVar`, `KNOWN_AGENTS`, `DEFAULT_AGENT`,
  `agentsForUi`, `validateManifest` exported from `src/config/manifest.ts:37-126`.
- **EVIDENCE (drift, doc-side):** `src/types/index.ts:133-137` still exports `AppConfig`
  with `wrapperUrl: string` and `agentOptions: AgentName[]` — the retired wrapper's shape.
  Zero consumers in `src/` (grep). DATA_CONTRACT §1.12 still documents it with the retired
  Cloud Run wrapper URL (`DATA_CONTRACT.md:271`).
- **EVIDENCE (drift, doc-side):** `src/types/index.ts:9` header comment still says "to/from
  the FastAPI wrapper"; §"Wrapper API — wire shapes" at `:78`. Wrapper is retired (BIM-002 N11).
- **EVIDENCE (drift):** `src/services/profileService.ts` + `src/mocks/data/profiles.ts` +
  `ProfileRow` type target a table `adk_n8n_hybrid_profiles` (DATA_CONTRACT §1.8, §2.3) that
  **no SQL file creates** (`grep adk_n8n_hybrid supabase/` → nothing). `profileService` has
  zero non-test consumers — BIM-004 D1 took it out of the chat path. It is a mock-only fossil.
- **EVIDENCE (drift):** `MissionControlPageContent.tsx:12-17` hardcodes
  `greeting_agent, calc_agent, jarvis_agent, product_agent` (DATA_CONTRACT §4) — none of which
  exist in the current manifest → in LIVE mode every block would 400 ("Unknown agent") from
  `/api/agent/instructions` (`route.ts:46-54` validates against `KNOWN_AGENTS`). Its subtitle
  text (`:31-32`) still says "Saves to mock storage today; real GCS persistence comes in the
  backend swap phase" — stale since BIM-005.

### S0.3 — Forbidden-zone greps (kit baseline)
- **EVIDENCE `: any` / `as any` (non-test):** 4 sites —
  `src/store/useAuthStore.ts:6` (`user: any | null`),
  `src/utils/supabase/server.ts:6` (`(await cookies()) as any`),
  `src/components/ui/command.tsx:35` (`{children as any}`),
  `src/app/(cyberize)/chat/MessageBubble.tsx:85` (`style={codeTheme as any}`).
  Tests: 53 occurrences (mock plumbing; not gated).
- **EVIDENCE `dangerouslySetInnerHTML`:** 0 in `src/`.
- **EVIDENCE `user_metadata.(is_|role)`:** 0 reads for authorization. `user_metadata` is
  WRITTEN (`full_name`, `role`) by admin/superadmin `actions.ts` so the DB trigger can copy
  it; role is READ from `user_roles` (`get-user-role.ts:21-25`, `login/route.ts:52-58`).
  One display read: `members-portal/profile/ProfileForm.tsx:25` (`full_name` fallback).
- **EVIDENCE `getStaticProps|getServerSideProps`:** 0. `@ts-ignore|@ts-nocheck`: 0.
  `eslint-disable`: 10 (8 in one test file for `require`, 2 `no-console`).

### S0.4 — Doc-named routes verified by build
See the route table in S0.7. Every route the docs name (`/chat`, `/mission-control`,
`/api/agent/run|history|instructions`, `/auth`, three portals) exists.

### S0.5 — Test runner + board (fresh run, not history)
- **EVIDENCE:** `package.json:10` `"test": "jest"`; Jest 30.0.5 / ts-jest 29.4.1;
  `jest.config.js` `testEnvironment: 'node'` with per-file jsdom pragmas; roots `src/`;
  `agent_docs` outside roots. **Not Vitest.**
- **EVIDENCE:** `npx jest` → **Test Suites: 10 failed, 26 passed, 36 total · Tests: 38 failed,
  225 passed, 263 total · 7.9s.** Failing suites: `api/agent-run`, `api/agent-history`,
  `api/instructions-route`, `config/manifest`, `chat/chatStore.persist`,
  `chat/chatStore.modeSplit`, `chat/AgentSwitcher`, `chat/SessionPanel`,
  `chat/MessageList.loading`, `chat/ChatPageContent`.
- **EVIDENCE (cause):** failures are of two shapes only — `Expected: 502/500/200 · Received:
  400` (routes reject `greeting_agent` as unknown) and `Expected "greeting_agent" · Received
  "architect_agent"` (`DEFAULT_AGENT` moved). `manifest.test.ts:126` literally asserts "includes
  the original five agents". **INFERENCE:** reverting the manifest edit (or updating mocks +
  tests to the new roster) returns the board to green; no other regression is visible in
  the failure output.
- **EVIDENCE:** `npx tsc --noEmit --incremental false` → exit 0.
- **EVIDENCE:** `npm run lint` → `Invalid project directory provided, no such directory:
  .../lint` — `next lint` was removed in Next 16 (known B1). No ESLint config file exists
  at root (`eslint.config.*`, `.eslintrc*` → none).
- **EVIDENCE:** `"test:e2e": "playwright test"` + `@playwright/test@1.59.1` installed, but
  **no `playwright.config.*`, no `e2e/`, no `tests/`** → GAP: e2e script is a stub.

### S0.6 — Env var NAMES (names only — values never printed)
- **EVIDENCE (`.env.example`, 9 names):** `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`,
  `NEXT_PUBLIC_CHAT_MODE`, `ADK_BUNDLE_URL_V1`, `ADK_BUNDLE_URL_V2_LOCAL`, `GCS_BUCKET`,
  `GCS_BASE_FOLDER`.
- **EVIDENCE (code `process.env.*` in `src/`, 8 names):** `NEXT_PUBLIC_CHAT_MODE` (×20),
  `ADK_BUNDLE_URL_V1` (×10, tests), `GCS_BUCKET` (×7), `GCS_BASE_FOLDER` (×6),
  `NEXT_PUBLIC_SUPABASE_URL` (×6), `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (×5),
  `SUPABASE_SECRET_KEY` (×3), `NEXT_PUBLIC_SITE_URL` (×3). Bundle URL vars are read
  dynamically via `process.env[urlEnv]` (`run/route.ts:39`, `history/route.ts:36`) — the
  manifest's `urlEnv` string is the lookup key, so `ADK_BUNDLE_URL_V2_LOCAL` never appears
  literally in code.
- **EVIDENCE (`.env.local` NAMES, 14; gitignored; values not read):**
  `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_BASE_URL`, `ADK_WRAPPER_URL`,
  `NEXT_PUBLIC_CHAT_MODE`, `ADK_BUNDLE_URL_V1`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_STARTER`,
  `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENTERPRISE`, `STRIPE_WEBHOOK_SECRET`.
- **DRIFT:** `.env.local` carries **6 dead names** (`NEXT_PUBLIC_API_BASE_URL`,
  `ADK_WRAPPER_URL` — retired BIM-002 R1 — and 4 Stripe vars from the kit; `stripe` is
  installed but has zero importers in `src/`) and is **missing 3 live names**
  (`ADK_BUNDLE_URL_V2_LOCAL`, `GCS_BUCKET`, `GCS_BASE_FOLDER`). → Mission Control LIVE
  would 500 "GCS_BUCKET is not configured" on this machine right now
  (`instructions/route.ts:28-44`). `session_2026-07-26.md:65-68` claims GCS vars are in
  `.env.local` — **CLAIM contradicted by disk.**
- **QUESTION:** `.env.local` was touched Aug 26 — what changed? (Values deliberately not
  inspected.) Is the current `NEXT_PUBLIC_CHAT_MODE` live or mock? It decides which
  localStorage namespace and which service path the next manual pass exercises.
- **EVIDENCE (test env):** `src/__tests__/jest.setup.ts:1-4` seeds Supabase URL/key/site
  URL defaults.

### S0.7 — Build route table (ground truth)
- **EVIDENCE:** `npm run build` → `▲ Next.js 16.2.6 (Turbopack)` · `✓ Compiled successfully
  in 11.5s` · `Finished TypeScript in 9.8s` · 24/24 static pages · `ƒ Proxy (Middleware)`.
  Warning: `caniuse-lite` 12 months old.

```
ƒ /                              ƒ /api/auth/superadmin-add-user   ƒ /members-portal
○ /_not-found                    ○ /auth                           ƒ /members-portal/profile
ƒ /admin-portal                  ƒ /chat                           ƒ /mission-control
ƒ /admin-portal/add-member       ○ /demo                           ƒ /profile
ƒ /admin-portal/edit/[id]        ○ /error                          ƒ /superadmin-portal
ƒ /api/agent/history             ƒ /api/agent/instructions         ƒ /superadmin-portal/add-user
ƒ /api/agent/run                 ƒ /api/auth/confirm               ƒ /superadmin-portal/edit/[id]
ƒ /api/auth/login                ƒ /api/auth/logout                ○ /template
ƒ /api/auth/signup
```
- **INFERENCE:** `/demo`, `/template`, `/profile` (the `(admin)/profile` one, distinct from
  `/members-portal/profile`) are kit scaffolding, not product (see Section 8).

---

## Section 1 — Stack Versions (installed, from `node_modules/*/package.json`)

| Dep | package.json range | Installed |
|---|---|---|
| next | ^16.2.1 | **16.2.6** (Turbopack) |
| react / react-dom | ^19.2.4 | **19.2.4** |
| typescript | ^5 | **5.5.4** |
| tailwindcss | ^3.4.1 | **3.4.6** → token mechanic: **HSL CSS vars via `tailwind.config.ts` `extend.colors`** (v3 style; no `@theme`/OKLCH) |
| zustand | ^4.5.4 | 4.5.4 |
| @supabase/supabase-js / @supabase/ssr | ^2.44.0 / ^0.6.1 | 2.106.1 / 0.6.1 |
| @google-cloud/storage | ^7.21.0 | 7.21.0 (only Google dep; ADC auth) |
| react-markdown / remark-gfm / react-syntax-highlighter | ^10.1.0 / ^4.0.1 / ^16.1.1 | 10.1.0 / 4.0.1 / 16.1.1 |
| next-themes | ^0.4.6 | 0.4.6 |
| lucide-react | ^1.16.0 | 1.16.0 |
| sass | ^1.77.6 | 1.77.8 |
| stripe | ^22.1.0 | 22.1.0 — **zero importers in `src/`** (kit residue) |
| zod | ^3.23.8 | 3.23.8 |
| jest / ts-jest / jest-environment-jsdom | ^30.0.5 / ^29.4.1 / ^30.0.5 | 30.0.5 / 29.4.1 / — |
| @playwright/test | ^1.59.1 | 1.59.1 (no config, no specs) |
| @types/node | ^20 | — (runtime Node is 26) |

- **EVIDENCE:** Node **v26.7.0**, npm **11.19.0** on this machine. **No pin:** no `.nvmrc`,
  no `.node-version`, no `"engines"` in `package.json`. `@types/node@^20` lags runtime by
  six majors — no observed breakage.
- **ADK version: NOT DETERMINABLE FROM THIS REPO.** No Python, no `requirements*.txt`, no
  Dockerfile, no ADK JS/TS package (`ls node_modules | grep -iE "adk|a2a|genai"` → nothing).
  The bundle is a separate deployment reached over HTTP via `ADK_BUNDLE_URL_*`. The ADK
  wire format the connector assumes (events with `author`, `content.role`, `content.parts[]`
  of `text|functionCall|functionResponse`; `POST /run` with `app_name/user_id/session_id/
  new_message`; sessions at `/apps/{app}/users/{u}/sessions/{s}`) is encoded in
  `src/__tests__/api/fixtures/adk-events.ts` and `_lib/adk.ts:124-172`. The only ADK
  version string in the repo is the extraction doc's origin repo name
  `google-adk-n8n-hybrid-streamlit-v2` — not a library version. → **GAP.**
- **Hermes client dependencies: none** (see Section A2A).

## Section 2 — Kit Structure vs Handbook
- **EVIDENCE:** 181 files under `src/`. Route groups: `(admin)`, `(auth)`, `(cyberize)`,
  `(members)`, `(public)`, `(superadmin)` + ungrouped `api/`, `error/`, `providers/`,
  `template/`.
- **EVIDENCE:** `src/services/` = 5 files (`chatService`, `sessionIndexService`,
  `instructionsService`, `profileService`, `index.ts` barrel). **Barrel `index.ts` has zero
  importers** — every consumer imports the concrete file (`@/services/chatService` etc.),
  contradicting its own header ("UI components import from `@/services` only") and the
  stark-frontend-first doctrine.
- **EVIDENCE:** `src/store/` = `chatStore.ts`, `useAuthStore.ts`. `src/types/` = `index.ts`,
  `tailwind-merge.d.ts`. `src/utils/` = `app-role.ts`, `get-user-role.ts`, `speech.ts`,
  `common/commonUtils.ts`, `supabase/{actions,admin,client,fetchUserData,middleware,server}.ts`.
  `src/config/manifest.ts`. `src/mocks/{responses.ts, data/{instructions,messages,profiles,sessionIndex}.ts}`.
- **EVIDENCE:** `src/proxy.ts` present; no `middleware.ts` anywhere — correct for Next 16.
  `proxy.ts` only refreshes the Supabase session (`updateSession`); **it does not gate
  routes** — gating is per-layout via `protectPage` (Section 3).
- **EVIDENCE:** `AppRole` enum defined in `src/utils/app-role.ts:16` (server-free) and
  re-exported from `get-user-role.ts:6`. `getUserRole` at `get-user-role.ts:16`.

## Section 3 — Auth Pattern
- **User read via:** client — `useAuthStore((s) => s.user)` (Zustand + `persist`, key
  `auth-store`, **no partialize → the full `user: any` object is written to localStorage**,
  `useAuthStore.ts:62-64`); server — `supabase.auth.getUser()` in `protectPage`
  (`utils/supabase/actions.ts:10`) and page files.
- **Role resolved via:** DB table `user_roles` — `getUserRole()` (`get-user-role.ts:16-33`)
  for layouts; `login/route.ts:52-58` inline query for the login response. Canonical per
  `supabase/setup.sql:22` comment.
- **Route gates:** `protectPage([roles])` in each group layout —
  `(cyberize)/layout.tsx:15` any role; `mission-control/layout.tsx:11` ADMIN+SUPERADMIN;
  portal layouts likewise. Redirect target `/auth`.
- **Existing auth service:** none by design (`services/index.ts:5-6`, STARTER_KIT_FEEDBACK
  Lesson 2). Kit auth consumed directly.
- **user_metadata role smells:** none for authorization (S0.3).
- **API-route auth:** **`/api/agent/run`, `/api/agent/history`, `/api/agent/instructions`
  (GET + PUT) have NO caller authentication** — they read `req.headers.get('authorization')`
  only to forward it (R2 reserved slot). Any browser with the origin can PUT agent
  instructions to GCS. Known as I7/R2 → "BIM-006's mandate" (`session_2026-07-26.md:117-119`).
  EVIDENCE: `run/route.ts:26`, `instructions/route.ts:75-103`.
- **EVIDENCE (kit fossil):** `api/auth/login/route.ts:11-27` exports a `GET` that queries a
  `posts` table which no SQL creates — a leftover "testing the route" handler. It is live
  on `/api/auth/login`.
- **EVIDENCE (kit fossil):** `api/auth/logout/route-1.ts` — a second, older logout handler
  (no `revalidatePath`); not a Next route (wrong filename), zero importers. Already flagged in
  the 07-17 recon; still present.

## Section 4 — Design Reality
- **Tokens live in:** `src/app/globals.scss` (875 B; `:root`/`.dark` HSL vars; imported by
  `src/app/layout.tsx:3`). A second `src/styles/global.scss` (935 B) exists with **zero
  importers** — orphan twin. `components.json` points at `app/globals.scss` (path without
  `src/` — cosmetic).
- **Sass-only syntax in `globals.scss`:** one `//` comment at line 37 (would break a `.css`
  rename). Otherwise plain CSS + `@apply`.
- **Hardcoded numbered colors:** **248** occurrences across 44 files in `src/components` +
  `src/app` (top: `AddUserForm.tsx` 17, `MessageBubble.tsx` 13, `AddMemberForm.tsx` 13,
  `SuperadminPortalPageContent.tsx` 12, `SessionPanel.tsx` 11, `AppShellPage.tsx` 11,
  `LoginForm.tsx` 11, `MessageList.tsx` 11). The cyberize surface is **zinc-scale by
  convention**, not token-driven; the kit's navbars use `slate-`. Tokens defined in
  `tailwind.config.ts` (`background`, `foreground`, `primary`, … via `hsl(var(--x))`) are
  largely unused by the chat UI.
- **Dark mode:** `darkMode: ["class"]` (`tailwind.config.ts:4`); `next-themes`
  `ThemeProvider attribute="class" defaultTheme="dark" enableSystem` (`app/layout.tsx:22-27`).
- **Font:** `Inter` via `next/font/google` (`app/layout.tsx:2,7`). No `@font-face`.
- **Theme toggle:** **two implementations** — `components/global/ThemeToggle.tsx` (cyberize,
  auth) and `components/global/ThemeToggler.tsx` (kit navbars). Both live.
- **Root metadata:** `title: "Moose Next Framework v3"`, description "This is just ui/ux
  framework with Shadcn" (`app/layout.tsx:9-12`) — kit placeholder shipped as the app title.
- Q4.7 (real-screen dark-mode pass) — operator-run, not greppable; not performed here.

## Section 5 — Database (Supabase; SQL files, not migrations)
- **Migrations:** none (`supabase/migrations/` absent). Two hand-run setup files:
  `supabase/setup.sql` (kit) and `supabase/chat_sessions_setup.sql` (BIM-004).
- **Tables shipped:** `public.user_roles` (enum `app_role`: superadmin|admin|member; UNIQUE
  user_id), `public.profiles` (id, full_name, email, created_at), `public.chat_sessions`
  (id uuid, user_id, agent_name, adk_session_id, title default 'New chat', created_at,
  updated_at, archived bool; UNIQUE(user_id, agent_name, adk_session_id); index
  `chat_sessions_list_idx (user_id, agent_name, archived, updated_at DESC)`).
- **Triggers/functions:** `public.handle_new_user()` (setup.sql:87) on auth signup → writes
  `profiles` + `user_roles` from `user_metadata`; "promote first superadmin" step (:118).
- **RLS:** enabled on all three tables. `chat_sessions`: SELECT / INSERT / UPDATE own-rows
  policies, **no DELETE policy** (archive-only by design, `sessionIndexService.ts:156`).
- **EVIDENCE (drift):** `adk_n8n_hybrid_profiles` (DATA_CONTRACT §1.8/§2.3,
  `profileService.ts:43-44`) — **never created**, never queried in live code.
- **CLAIM (session_2026-07-26.md:69):** `chat_sessions` was created in the live project on
  07-20. Not verifiable from disk.
- **EVIDENCE:** `supabase/CLAUDE.md` is a byte-for-byte copy of the project CLAUDE.md (same
  v3.1 header) — misplaced duplicate, not a DB doc.

## Section 6 — Skills / Security / Env
- **Skills present (`.claude/skills/`, resolve from repo root):** `frontend-design`,
  `stark-frontend-first`, `skill-creator`. **`stark-recon` is NOT installed as a skill** —
  it lives only in `_SKILLS/stark-recon-skill-v1.1/` (invoked by path this run). A second
  copy of `stark-frontend-first` sits under
  `agent_docs/CURRENT_APP/app-factory-frontend-first-module/skills/`.
- **`.claude/settings.local.json`:** allow-list for `npx tsc`, `npx jest`, `npm audit`,
  `npx eslint`, one hardcoded `node -e` version probe.
- **Security audit:** `npm audit` → **14 vulnerabilities (1 low, 5 moderate, 8 high).**
  `agent_docs/security/` absent. Not triaged here (read-only).
- **Required env vars (live path):** `NEXT_PUBLIC_CHAT_MODE=live` + `ADK_BUNDLE_URL_V1`
  (+ `_V2_LOCAL` if any agent moves to `v2-local`) + `GCS_BUCKET` + `GCS_BASE_FOLDER` +
  the 4 Supabase/site vars. Fail-closed check: routes 500 naming the missing var; **no
  boot-time env validation** (no `instrumentation.ts`).
- **Launch CWD:** repo root (`/home/moose/nextjs/adk-agent-harness-nextjs-frontend-v1`).
- **Pointer files at root:** `CLAUDE.md` (v3.1), `WINDSURF.md` (20 KB, May 29 — stale IDE
  twin), `RECOVERY.md`, `BACKEND_SWAP_NOTES.md`, `README.md` (2 lines), six `session_*.md`.
  No `AGENTS.md`/`GEMINI.md` at root (they exist under the factory module folder).

## Section 8 — Demo / Tutorial Scaffolding (kit residue)
- **Kit demo pages (live routes):** `/demo` (`(public)/demo/DemoPageContent.tsx` — lorem
  ipsum + button showcase), `/template` (`template/TemplatePageContent.tsx` — "Copy Me"
  lorem page), `/profile` (`(admin)/profile/` — a second profile form beside
  `/members-portal/profile`). Cascade: `components/common/{Page,Row,Box,Container,Main}.tsx`
  serve them (Page/Row/Box/Main also used by portals — deletion needs a consumer check).
- **Third-party demo APIs:** none (`jsonplaceholder|dummyjson|…` → 0). Kit logos are hot-
  linked from `res.cloudinary.com/dyb0qa58h/…` in all four navbars (`next.config.js`
  whitelists the host).
- **Kit fossils:** `login/route.ts` GET → `posts` table; `logout/route-1.ts`; `stripe` dep +
  4 Stripe env names with no code; `WINDSURF.md`.
- **Orphans (zero non-test importers, grep by basename):** `services/index.ts`,
  `components/dashboard/DashboardCard.tsx`, `components/global/NavbarSuperadmin.tsx`,
  `components/global/NavbarLoginReg.tsx`, `components/common/BackButton.tsx`,
  `components/common/Container.tsx`, `components/ui/{tabs,textarea,pagination,badge,table}.tsx`,
  `utils/supabase/fetchUserData.ts`, `utils/common/commonUtils.ts`, `styles/global.scss`,
  `services/profileService.ts` (+ `mocks/data/profiles.ts`, `ProfileRow`, `AppConfig` types).
- **Recommended deletion bucket:** a dedicated "kit-residue sweep" cluster, after the board is
  green again — not inside any BIM module.

## Section 9 — FFM Packaging & Compile Scope
- **EVIDENCE:** `tsconfig.json` `exclude: ["node_modules", "agent_docs/**"]` → **yes**,
  agent_docs excluded. `_SKILLS/**` is NOT excluded but contains no `.ts` (only `.md`).
- **EVIDENCE:** Jest `roots: ['<rootDir>/src']` → agent_docs never scanned.
- **EVIDENCE:** `find agent_docs -name "*.ts*"` → none. `.claude/skills/skill-creator/` holds
  `.py` files — irrelevant to tsc.
- `tsconfig.tsbuildinfo` (205 KB) and `next-env.d.ts` are both gitignored — build/tsc runs
  leave the tracked tree untouched (verified).

## Section 11 — Nav & Auth-State
- **Four navbars:** `NavbarHome` (public layout — logo, ThemeToggler, auth-state region:
  avatar dropdown + Logout when logged in, Login link otherwise; **portal links now commented
  out, uncommitted**), `Navbar` (same shape; used by portals via `AppShellPage`?—
  INFERENCE), `NavbarSuperadmin` (orphan), `NavbarLoginReg` (orphan). Desktop nav is
  `hidden sm:flex` — **no hamburger** on marketing nav (`NavbarHome.tsx:90`); mobile users
  get logo + toggle + avatar only. With the links commented out there is currently nothing
  to hamburger.
- **Cyberize shell:** `AppShellPage` with `CyberizeSidebar` (Agents + Conversations +
  Mission Control link for admin+, ThemeToggle, sign-out) and a mobile top bar
  (`(cyberize)/layout.tsx:18-22`). Theme toggle reachable on every surface incl. `/auth`
  (`(auth)/layout.tsx:8`).
- **Split hero:** none on `/` — `HomePageContent.tsx:121` is a tile grid
  (`sm:grid-cols-2 lg:grid-cols-3`). Q11.4 N/A.

## Section 12 — Verification Predicates (current values)
- Numbered colors in components/app: **248** (Q4.2). `any` in non-test src: **4**.
  `user_metadata` role reads: **0**. `dangerouslySetInnerHTML`: **0**. Forbidden Pages-router
  exports: **0**. Board: **RED 10/38** (S0.5). tsc: **clean**. build: **clean**. lint: **N/A**
  (B1). e2e: **stub**.

---

## OPERATOR CAPTURE 1 — A2A wiring, ports, Hermes worker mapping

- **EVIDENCE (exhaustive grep):** `grep -rniE "a2a|hermes|990[0-9]|agent[-_ ]?card|\.well-known"`
  over `src/ config/ scripts/ *.md agent_docs/` → **one hit**:
  `config/agents.manifest.json:8` `{ "name": "hermes_agent", "bundle": "v1", "label": "Harmes Main Agent" }`.
  Nothing in `agent_docs/` (13 BIM/FIX/FEAT folders, 10 APP_FACTORY manuals, 24 RESPONSES)
  mentions A2A, Hermes, or ports 9901–9903.
- **EVIDENCE:** no npm dependency for A2A/ADK/Hermes (`ls node_modules | grep -iE
  "adk|a2a|hermes|genai|anthropic|openai|langchain"` → nothing; `@google-cloud/` holds only
  `storage`).
- **EVIDENCE — the ONLY upstream protocol in the repo (`src/app/api/agent/_lib/adk.ts`):**
  - `POST {ADK_BUNDLE_URL}/apps/{agent}/users/{user_id}/sessions/{session_id}` body `{}` →
    create session (`:135-154`, 10 s cap).
  - `POST {ADK_BUNDLE_URL}/run` body `{ app_name, user_id, session_id, new_message: { role:
    'user', parts: [{ text }] } }` (`:156-172`, 75 s cap; 90 s total budget incl. one
    not-found→create→retry).
  - `GET {ADK_BUNDLE_URL}/apps/{agent}/users/{u}/sessions/{s}` → session events → history
    (`history/route.ts:44-61`, 30 s).
  - Response selection: last event with `content.role === 'model'` + text part (`:65-72`).
  - Non-streaming (`grep run_sse|EventSource|text/event-stream` → 0). Optional
    `Authorization` header forwarded verbatim (`:114-119`).
- **EVIDENCE — how "agent shells" map today:** manifest `agents[].bundle` → `bundles[].urlEnv`
  → `process.env[urlEnv]` → base URL; `agent.name` becomes the ADK `app_name`. All five
  current agents (incl. `hermes_agent`) point at bundle `v1` = `ADK_BUNDLE_URL_V1`. Bundle
  `v2-local` (`ADK_BUNDLE_URL_V2_LOCAL`, example value port 8000) is declared but **has no
  agents assigned**.
- **GAP → QUESTION for the Architect:** the "Hermes workers on 9901/9902/9903" model is not
  represented anywhere in this repo. If those are three separate ADK `api_server` (or A2A)
  endpoints, the nearest existing hook is the manifest: three new `bundles[]` entries (one
  `urlEnv` each) and per-agent `bundle` assignments would route without code changes —
  **provided the workers speak ADK api_server REST.** If they speak A2A (JSON-RPC
  `message/send`, agent cards), `_lib/adk.ts` has no equivalent and a new connector is
  required. Which is it? A sibling folder `../_for_readme/adk-agent-harness-v2` exists on
  this machine (not inspected — outside the repo); it may hold the backend truth.

## OPERATOR CAPTURE 2 — Where session state lives; restart survival

| State | Lives in | Written by | Survives browser reload | Survives Next.js server restart | Survives ADK bundle restart |
|---|---|---|---|---|---|
| Transcript (messages) | **ADK bundle session store** (upstream, outside repo) | ADK `/run` | yes (refetched via `/api/agent/history`) | yes | **UNKNOWN — GAP** (depends on bundle's SessionService; if `InMemorySessionService`, every session is lost and the index rows become dangling; the connector's not-found→create→retry (`adk.ts:196-210`) would silently re-create an EMPTY session under the same id) |
| Session INDEX (which sessions exist, titles, archived) | Supabase `public.chat_sessions` (RLS per user) — LIVE only | `sessionIndexService` (client-side supabase-js, `sessionIndexService.ts:46-173`) | yes | yes | yes |
| Active-session pointer per agent (`agentSessions`) + `selectedAgent` | browser `localStorage` key `adk-session-map-live` or `-mock` (`chatStore.ts:37-39,198-214`); legacy `adk-session-map` adopted once on live boot (`:46-59`) | Zustand `persist` | yes (per browser/profile) | yes | n/a |
| Message content in UI (`messagesByAgent`), `sessionListByAgent`, loading flags | Zustand memory only (partialize fence) | `ChatPageContent` | **no** (refetched) | n/a | n/a |
| Auth session | Supabase cookies (`@supabase/ssr`, refreshed by `proxy.ts`) + `localStorage` `auth-store` (full `user` object + role, no partialize) | kit | yes | yes | n/a |
| Agent instructions | GCS object `{GCS_BASE_FOLDER}/{agent}/{agent}_instructions.txt` + `versions/*.bak` — LIVE only | `/api/agent/instructions` PUT (backup-before-write, `gcsInstructions.ts:64-92`) | yes | yes | yes |
| MOCK-mode index / instructions / profiles | module-level arrays in `src/mocks/data/*.ts` | services | **no** (module re-evaluates) | **no** | n/a |
| Next.js server-side session cache | **none** — routes are stateless proxies | — | — | — | — |

- **EVIDENCE:** `chatService.getHistory` returns `[]` on any failure (`chatService.ts:91-94`)
  → a lost upstream session renders as an empty thread, not an error. Combined with the
  retry-once create, **a bundle restart with in-memory sessions is invisible to the user
  except as silent amnesia.** No code path reconciles a dangling `chat_sessions` row.
- **EVIDENCE:** session ids are client-of-bundle generated: `session-${Date.now()}`
  (`adk.ts:53`) in live, `mock-session-${Date.now()}` in mock (`responses.ts:26`).
  `user_id` sent to ADK is the Supabase auth uid (`ChatPageContent.tsx:36-39`).

## OPERATOR CAPTURE 3 — Artifact / file-transport code paths

- **EVIDENCE:** `src/app/(cyberize)/chat/AttachmentMenu.tsx` — "Upload file" / "Upload image"
  menu items; each does `console.info(...)` then calls an optional callback (`:51-63`).
  Header comment `:10-12`: "Both are stubs in Phase 5.5 — callbacks fire but no actual
  upload logic."
- **EVIDENCE:** `ChatInput.tsx:15-16,85-87` threads `onUploadFile/onUploadImage` props
  through to the menu; **`ChatPageContent.tsx` never passes them** (grep → 0 hits) → the
  callbacks are `undefined`; clicking logs to console and nothing else.
- **EVIDENCE:** no upload route (`find src/app/api` → only `auth/*` and `agent/{run,history,
  instructions}`), no `multipart`/`FormData` (file) handling, no `inline_data`/`inlineData`/
  `file_data`/`Blob` usage in `src/` (grep → 0 outside Supabase form `formData` objects).
- **EVIDENCE:** the ADK request is text-only — `new_message.parts: [{ text }]`
  (`adk.ts:168`); reads keep only the first string `text` part per event and skip
  `functionCall`/`functionResponse`/any binary part (`adk.ts:97-106`). `Message` type is
  `{ role, content: string }` (`types/index.ts:51-54`) — no attachment field.
- **EVIDENCE:** the sole object I/O in the repo is GCS text instructions
  (`@google-cloud/storage` `download()` / `copy()` / `save(content, {contentType:'text/plain'})`,
  `gcsInstructions.ts:51-91`). Reusable pattern (ADC `new Storage()`, bucket/folder from env)
  if artifacts go to GCS — but nothing generalizes it today.
- **EVIDENCE (rendering side):** `MessageBubble.tsx` renders markdown via `react-markdown` +
  `remark-gfm` + `react-syntax-highlighter` — text artifacts (code blocks, tables) render;
  images/files have no rendering path.
- **Verdict:** **no artifact transport exists, partial or otherwise.** Two UI stubs and a
  text-only wire.

## OPERATOR CAPTURE 4 — Exact versions & env names
Consolidated in Section 1 (versions) and S0.6 (17 distinct env NAMES across example/code/
local; 9 canonical). Values were not read or printed.

---

## Section 10 — Surprises (the gold)

1. **Silent Aug-26 session.** Manifest rewritten to a Hermes-era roster, a `copy.json`
   snapshot dropped beside it, NavbarHome portal links commented out, `.env.local` touched —
   no session log, no CHANGELOG, no RESPONSES artifact, no plan. This is exactly the
   "process violation" class the CLAUDE.md protocol exists to prevent, and it turned a
   green board red without anyone noticing for three days.
2. **The type system no longer guards agent names.** BIM-003 made `AgentName = string`; the
   compiler happily builds a tree whose mocks, Mission Control list, and 28 test files name
   agents that no longer exist. Only Jest catches it — and Jest was not run.
3. **Mission Control is doubly broken in LIVE mode right now:** hardcoded old agent names
   (400 from the route) AND missing `GCS_BUCKET`/`GCS_BASE_FOLDER` in `.env.local` (500).
   Its subtitle still says "Saves to mock storage today."
4. **`useAuthStore` persists the entire Supabase `user` object (typed `any`) to
   `localStorage`** — kit behaviour, never partialized. Not a secret leak (no tokens in that
   object per supabase-js) but it is the one `any` that reaches storage.
5. **`hermes_agent` label typo "Harmes Main Agent"** is what the sidebar renders
   (`AgentSwitcher.tsx:47` renders `label`).
6. **`services/index.ts` barrel is dead** despite being the documented "sole swap point".
7. **Two theme toggles, two navbars-with-dropdowns, two `global(s).scss`, two logout
   routes, two profile pages** — the kit/product seam was never swept.
8. **`.env.local` is a superset of three eras** (kit Stripe, BIM-001 wrapper, BIM-002+ bundle)
   and a subset of the current contract (no GCS, no V2_LOCAL).
9. **`npm audit`: 8 high** — never triaged in any session log.
10. **`login/route.ts` GET handler queries a non-existent `posts` table** — reachable in prod.
11. **`cn()` helper:** present and standard (`src/lib/utils.ts:4-6`, `twMerge(clsx(...))`) —
    the one thing that was exactly as documented.
12. **`FILE_TREE.md` never existed** for this project; the project CLAUDE.md's factory-doc
    reading order names it.
13. **`WINDSURF.md`** (20 KB, May 29) — a second agent-doctrine file at root, untouched since
    Run 001; INFERENCE: stale twin of an earlier CLAUDE.md.

---

## Recommendation to Architect

### Verified facts the next brief can be written against (no re-verification needed)
- Stack: Next 16.2.6 / React 19.2.4 / TS 5.5.4 / Tailwind 3.4.6 (HSL-var tokens, class dark
  mode, next-themes) / Zustand 4.5.4 / Jest 30 + ts-jest / Node 26 unpinned / no ESLint config.
- Upstream contract: ADK `api_server` REST only, non-streaming, text-only parts, one
  bundle URL per manifest bundle, agent name == ADK `app_name`. Connector in
  `src/app/api/agent/_lib/adk.ts`; routes are stateless and **unauthenticated**.
- State residency table (Capture 2) — transcripts upstream, index in Supabase
  `chat_sessions`, pointer in localStorage (mode-namespaced), content in memory.
- No file/artifact transport, no A2A, no Hermes client — greenfield.
- Manifest is the routing seam: new workers = new `bundles[]` entries + env NAMES, if and
  only if they speak ADK api_server REST.
- `tsconfig`/Jest exclude `agent_docs/**` — FFM `.ts` stubs are safe to ship there.

### Doctrine / doc drift to surface
- RECOVERY.md + session_2026-07-26.md "36/263 green" → **FALSE** (10/38 red).
- session_2026-07-26.md "GCS vars in .env.local" → **FALSE** (names absent).
- DATA_CONTRACT §1.1 agent union, §1.8/§2.3 `adk_n8n_hybrid_profiles`, §1.12 `AppConfig`
  wrapper URL, §2.2 `/run_agent`/`/get_history`, §4 Mission Control agent list — all stale
  vs disk (BIM-002/003/004 amendments supersede; base doc never re-baselined).
- Project CLAUDE.md names `FILE_TREE.md` and `reference/` — neither exists.
- `_SKILLS/stark-recon` output contract says lowercase `agent_docs/recon/`; repo convention
  is uppercase `RECON/` — update the skill's CLAUDE.md/SKILL.md/template, or accept the
  override permanently.
- Prompt referenced `RECON_QUESTIONNAIRE.md`; the skill file is `RECON_MISSION.md`.

### Cleanup candidates (report only — nothing touched)
- **P0 (blocks everything):** decide the manifest roster (revert to committed six, or
  migrate mocks + `MissionControlPageContent` + 28 tests to the new five) → green board →
  then commit FIX-003 per the 07-20 plan, then this.
- Fix label "Harmes" → "Hermes". Delete `config/agents.manifest copy.json` (or move to
  docs) — it is not loaded and will confuse the next reader.
- `.env.local`: drop `ADK_WRAPPER_URL`, `NEXT_PUBLIC_API_BASE_URL`, 4× `STRIPE_*`; add
  `GCS_BUCKET`, `GCS_BASE_FOLDER` (+ `ADK_BUNDLE_URL_V2_LOCAL` if used).
- Orphan list (Section 8) incl. `styles/global.scss`, `logout/route-1.ts`, `login` GET,
  `profileService` + `ProfileRow` + `AppConfig`, `services/index.ts` (either use it or drop it).
- `stripe` dependency; `WINDSURF.md`; `supabase/CLAUDE.md` duplicate; `/demo`, `/template`,
  `(admin)/profile` kit pages; root metadata title.
- `npm audit` triage (8 high). `caniuse-lite` refresh. Node/`@types/node` pin.
- Playwright: add a config or remove the two scripts.

### Open questions for the Operator
1. **What is the intended agent roster?** The Aug-26 manifest edit is the only evidence of
   the Hermes direction; it is uncommitted, undocumented, and breaks the board.
2. **What protocol do the 9901/9902/9903 workers speak** — ADK api_server REST (manifest-
   routable today) or A2A (new connector required)? Where is their spec? (Possibly
   `../_for_readme/adk-agent-harness-v2` — not inspected.)
3. **Which SessionService does the deployed bundle use?** Determines whether transcripts
   survive a bundle restart and whether the dangling-index scenario is real.
4. **Is `NEXT_PUBLIC_CHAT_MODE` currently live or mock on this machine?** (Not read.)
5. Was `chat_sessions` created in the live Supabase project, and was the GCS SA write-grant
   done? (Both are CLAIMs from the 07-26 park; unverifiable from disk.)
6. Should recon runs keep overriding the skill's lowercase folder, or will the skill be
   patched?

---

*Read-only run. Zero source changes. Zero git mutations. One file written (this report).
`git status --short` identical before and after; `tsconfig.tsbuildinfo`, `next-env.d.ts`,
`.next/` are gitignored build outputs touched by `tsc`/`next build`.*
