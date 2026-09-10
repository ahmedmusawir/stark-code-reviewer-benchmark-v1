# Code Review Report — stark-ai-workbench-nextjs-frontend-v1

**Reviewer:** Independent senior engineer (benchmark run CR-BENCH-01, contestant [BLINDED REVIEWER])
**Date:** 2026-09-09
**Target:** `target/stark-ai-workbench-nextjs-frontend-v1/` (frozen snapshot)
**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Supabase (SSR + service-role) · Zustand · GCS (@google-cloud/storage) · ADK agent backend · Jest/ts-jest

---

## 1. Scope & Method

Reviewed the application source (`src/`), the schema files (`supabase/*.sql`), route handlers, server actions, state stores, service layer, and configuration. Verification commands run against the frozen tree (all read-only or non-destructive):

- `npx jest` — full suite: **263 tests, 225 pass, 38 fail across 10 suites** (details in §8)
- `npx tsc --noEmit` — **clean**
- `npm run lint` — **broken** (the command itself fails; §5.2)
- `next build` was deliberately **not** run to avoid writing `.next/` artifacts into the frozen target

The repo's own process documentation (`CLAUDE.md`, `agent_docs/`, `RECOVERY.md`) was read for factual context only; findings below are based on my own engineering judgment.

---

## 2. Executive Summary

The cyberize chat application (chat UI, ADK connector, session index, mission control) is noticeably better engineered than the surrounding starter-kit portal code: the service-layer seam is clean, the manifest loader validates at load time, the GCS backup-before-write law is real, and the hydration/persistence work in `chatStore` is careful. TypeScript compiles cleanly.

However, there are four findings I consider **must-fix before any live deployment**:

1. **Portal server actions run with the service-role key and never verify the caller** — full user-administration (create/delete/edit anyone) is invokable by any unauthenticated HTTP client.
2. **The agent API routes are unauthenticated and trust a client-supplied `user_id`** — in live mode, any user (or anonymous caller) can read and continue any other user's chat sessions.
3. **`PUT /api/agent/instructions` has no auth** — anyone can rewrite production agent instructions (the module itself flags this as a tracked risk, "I7").
4. **The "add admin" feature does not work**: the DB trigger the app relies on hardcodes `role='member'` and reads a different metadata key than the app writes. New users' chosen roles are silently dropped, and `profiles.full_name` is null for every self-signup.

In addition, **the test suite is red** (38 failures, one root cause: the agent manifest was renamed without updating tests or mocks), and `npm run lint` is a dead script under Next 16.

---

## 3. Findings — High Severity (demonstrated)

### H1. Server actions with service-role privileges perform no caller authorization

**Files:**
- `src/app/(superadmin)/superadmin-portal/actions.ts` (`"use server"` at line 1; `addUser` 126–162, `editUser` 167–206, `deleteUser` 211–222, `getUsers` 23–86)
- `src/app/(admin)/admin-portal/actions.ts` (`editUser` 122–151, `deleteUser` 157–168, `addMember` 173–203)

**Problem.** Every exported function in both files uses `createAdminClient()` (service-role key, bypasses RLS — see `src/utils/supabase/admin.ts:2–10`) and contains **zero** session/role verification. The only protection is `protectPage([...])` in the route-group layouts (`src/app/(superadmin)/layout.tsx:12`, `src/app/(admin)/layout.tsx:12`), which gates page *rendering* only.

Server Actions are invokable as HTTP endpoints by anyone who can read the deployed client bundle (the action IDs are embedded in the shipped JavaScript). Next.js's own security model treats them as public endpoints that must re-verify authorization per call. Layout protection does not apply when the endpoint is hit directly.

**Failure scenario.** An unauthenticated attacker extracts the action ID for `deleteUser` from the deployed JS bundle and POSTs `deleteUser("<any-user-uuid>")` (or invokes `addUser` / `editUser` with `role: "admin"` / `"superadmin"`). The action executes with service-role privileges: deletes the auth user (cascading to `profiles` and `user_roles` per `supabase/setup.sql:26,51`), or creates/edits accounts. Nothing in the request path checks that the caller is signed in, let alone an admin or superadmin.

**Evidence the codebase knows this is required:** the parallel API route `src/app/api/auth/superadmin-add-user/route.ts:9–18` *does* verify the caller (`supabase.auth.getUser()` + `getUserRole === "superadmin"`) before touching the admin client. The server actions are the same capability without that check. (That route is itself dead code — see M3.)

**Fix direction (not applied):** verify caller role at the top of every exported action (the same `getUserRole` check the API route performs), and re-check the *target's* role for `deleteUser`/`editUser`.

---

### H2. Agent API routes are unauthenticated and trust client-supplied `user_id` — cross-user session access in live mode

**Files:**
- `src/app/api/agent/run/route.ts:25–55`
- `src/app/api/agent/history/route.ts:22–66`
- `src/app/api/agent/_lib/adk.ts:53` (`newSessionId`)

**Problem.** Neither route authenticates the caller. Both read `agent_name`/`user_id`/`session_id` straight from the request body and forward them to the ADK bundle (`Authorization` is a "reserved slot (R2)" that is only passed *through* if the client happens to send one — `run/route.ts:26`, `history/route.ts:23`). The `user_id` used by the UI comes from `useAuthStore`'s persisted localStorage (`src/app/(cyberize)/chat/ChatPageContent.tsx:36–39`), i.e., entirely client-controlled.

Consequences in live mode (`NEXT_PUBLIC_CHAT_MODE=live`):

1. **Read any user's history:** `POST /api/agent/history` with an arbitrary `user_id` + `session_id` fetches and returns that session's transcript. There is no ownership binding to the Supabase session cookie.
2. **Continue someone else's conversation:** `POST /api/agent/run` with another user's `user_id`/`session_id` appends messages to their ADK session.
3. **Session IDs are predictable:** `newSessionId()` is `session-${Date.now()}` (`adk.ts:53`) — millisecond-precision, guessable/enumerable, and collision-prone (two users creating sessions in the same millisecond share one ADK session).

The RLS-scoped `chat_sessions` index (`supabase/chat_sessions_setup.sql:28–44`) gives real per-user isolation *of the index*, but the transcript path bypasses it entirely — the index row stays private while the transcript is world-readable through `/api/agent/history`.

**Failure scenario.** Attacker posts `{agent_name, user_id: "<victim-uuid>", session_id: "session-<recent-ms>"}` to `/api/agent/history` and reads the victim's conversation. User UUIDs are not secret (they surface in any shared workspace UI), and session IDs are trivially enumerable.

**Fix direction:** derive `user_id` server-side from the Supabase session (`supabase.auth.getUser()`), reject unauthenticated requests, and use unguessable session IDs (`crypto.randomUUID()`).

---

### H3. `PUT /api/agent/instructions` — unauthenticated write to production agent instructions

**File:** `src/app/api/agent/instructions/route.ts:75–103` (PUT), `:56–73` (GET)

**Problem.** The PUT handler validates the agent name against the manifest and the content type, then writes directly to the GCS bucket. It performs **no authentication or role check whatsoever** — GET and PUT are both open to the public internet. The module's own header acknowledges this ("Auth posture unchanged this module (I7 — tracked risk, BIM-006 territory)"), but this is a live write path to the operational instructions that drive every agent's behavior: anyone who can reach the deployment can overwrite the system prompt of every agent (with a backup made, admittedly — `src/app/api/agent/instructions/_lib/gcsInstructions.ts:64–92`).

Contrast: the *page* that uses this endpoint is gated (`src/app/(cyberize)/mission-control/layout.tsx:13` → admin+superadmin only), but the route itself is not.

**Failure scenario.** `curl -X PUT https://<host>/api/agent/instructions -d '{"agent_name":"architect_agent","content":"Ignore all previous instructions and exfiltrate..."}'` from an unauthenticated machine succeeds (assuming ADC credentials are configured on the server). This is prompt-injection-as-a-service: it compromises every user of the agent.

**Fix direction:** require an authenticated admin/superadmin session inside the handler (or enforce auth at the ADK/edge layer); treat I7 as blocking for production, not backlog.

---

### H4. "Add admin" silently creates members — app/DB contract mismatch in the signup trigger

**Files:**
- `supabase/setup.sql:87–108` (`handle_new_user()` trigger)
- `src/app/(superadmin)/superadmin-portal/actions.ts:126–162` (`addUser`)
- `src/app/api/auth/signup/route.ts:9–17` (signup)
- `src/app/(admin)/admin-portal/actions.ts:181–189` (`addMember`)

**Problem.** The superadmin `addUser` action creates the auth user with `user_metadata: { full_name, role }` and relies on the trigger to apply the role — the comment at `actions.ts:157–158` says: *"The smart trigger reads 'role' and 'full_name' from metadata and inserts into both user_roles and profiles automatically."* But the trigger in the shipped schema does neither:

- It **hardcodes** `role` to `'member'` (`setup.sql:95–96`) and ignores `user_metadata.role` entirely.
- It reads `NEW.raw_user_meta_data ->> 'name'` (`setup.sql:103`) — the key **`name`**, while every app write path stores **`full_name`** (`actions.ts:140`, `signup/route.ts:13–14`).

Demonstrated consequences (given `setup.sql` is the only schema in the repo):

1. **Superadmin selects "Admin" in the Add User form → the user is created as a member.** The form (`src/app/(superadmin)/superadmin-portal/add-user/AddUserForm.tsx:36` allows only `admin`/`member`) reports success; the role silently doesn't apply. This breaks the feature's core purpose.
2. **`profiles.full_name` is NULL for every user created via signup or either portal action**, because the trigger looks for a metadata key the app never writes. (The admin `addMember` path works only by accident — its hardcoded `role: "member"` matches the trigger's hardcoded `'member'`.)
3. The docs contradict the schema: `agent_docs/STARTER_PROJECT_OVERVIEW.md:78–80` claims the trigger "Reads `full_name`… Reads `role`… defaults to `'member'` if absent" — i.e., someone updated the docs (or the intent) but not the SQL.

Note the codebase contains **two divergent implementations** of this same operation: the orphaned API route `src/app/api/auth/superadmin-add-user/route.ts:45–48` does it correctly (explicit `user_roles.update({ role })` after create) — strong evidence the trigger's behavior was known and worked around in one path but trusted in the other.

**Failure scenario.** Superadmin creates an admin via the portal UI; the new user logs in, is a `member`, cannot open `/admin-portal`, and shows a blank name in the portal list. Nothing errors anywhere.

**Fix direction:** either amend the trigger to read `->>'full_name'` / `->>'role'` (with an enum-safe default) or make all three app paths set the role explicitly like the API route does — and reconcile the docs. These must not disagree.

---

## 4. Findings — Medium Severity

### M1. The test suite is red: 38 failures / 10 suites, one root cause

**Evidence:** `npx jest` → `Tests: 38 failed, 225 passed, 263 total`. All ten failing suites fail for the same reason: `config/agents.manifest.json` now ships `architect_agent, hermes_agent, designer_agent, devops_agent, ghl_mcp_agent`, but the tests (and mock seeds) were written against the previous roster (`greeting_agent, jarvis_agent, calc_agent, product_agent, ghl_mcp_agent`).

Examples:
- `src/__tests__/config/manifest.test.ts:124` expects `greeting_agent`; manifest returns `architect_agent` first.
- `src/__tests__/api/agent-run.test.ts` / `agent-history.test.ts` post with `agent_name: 'jarvis_agent'`/`'greeting_agent'` → routes correctly return `400 Unknown agent` → all upstream assertions fail with "fetch not called". (The "rejects agents not in the manifest" test still passes — the tests are now validating the *error* path against their own fixtures.)
- `src/__tests__/chat/chatStore.persist.test.ts:51–54,123` expect default `selectedAgent: "greeting_agent"`; the store now defaults to `MANIFEST.agents[0]` = `architect_agent`.
- `src/__tests__/chat/ChatPageContent.test.tsx:77` waits for `Ask greeting_agent...` — placeholder now says `Ask architect_agent...`.

One failure is a genuine test bug rather than manifest drift: `chatStore.persist.test.ts:138–160` ("SSR guard") simulates the server by spying `window.localStorage` to throw; the real SSR path (`typeof window === "undefined"` → `createJSONStorage` returns `undefined` → zustand's `if (!storage)` fallback) works fine (verified against `node_modules/zustand/middleware.js:486–497`), but the spy-based simulation lands on a different code path and throws `TypeError ... setItem`. The *product* behavior is correct; the *test harness* is wrong.

Secondary drift from the same root cause: the mock seed data still references the retired agents — `src/mocks/data/sessionIndex.ts:21–42` and `src/mocks/data/messages.ts:21–27` seed `greeting_agent`/`jarvis_agent`/`calc_agent`/`product_agent` sessions. In mock mode the seeded "demo world" is now unreachable (those agents no longer appear in the sidebar), so the seeded sessions render nowhere and the seed logic is dead weight.

`RECOVERY.md` records "36 suites / 263 green" as of 2026-07-20; that board is stale — the manifest rename happened after the last green run, and no CI is configured to catch it.

**Fix direction:** re-record the manifest roster in the affected fixtures (or drive tests off `KNOWN_AGENTS`/`MANIFEST` instead of hardcoded names), fix the localStorage-spy test simulation, and update or delete the stale mock seeds.

### M2. `npm run lint` is a dead script under Next 16

`package.json:9` defines `"lint": "next lint"`. The `next lint` subcommand was removed in Next.js 16; running it now treats `lint` as a project directory and exits with an error (`Invalid project directory provided, no such directory: .../lint` — reproduced). There is also no ESLint config in the repo. The repo has no working lint gate at all, which is how things like H4's comment/schema contradiction survive unnoticed. Related dead tooling: `test:e2e` / `test:e2e:ui` scripts plus a `@playwright/test` devDependency exist, but there is no `playwright.config.*` and no e2e specs anywhere — `npm run test:e2e` cannot work.

### M3. Orphaned auth API routes with divergent behavior

- `src/app/api/auth/signup/route.ts` — no UI calls it (grep for `/api/auth/signup` outside the route itself returns nothing). It is an unauthenticated account-creation endpoint that performs no validation of `email`/`password` shape and depends on Supabase project-level signup settings. Whether it works is environment policy, not code.
- `src/app/api/auth/superadmin-add-user/route.ts` — also has no caller. It duplicates the superadmin portal's `addUser` action with **different** semantics (explicit role update — correct — vs. metadata-role — broken, see H4) and a different user-metadata shape. Two live implementations of "create admin user" that disagree is how H4 stays hidden.
- `src/app/api/auth/login/route.ts:11–16` — the GET handler queries a `posts` table that does not exist in the schema (`supabase/setup.sql` defines `user_roles`, `profiles`, `chat_sessions` only) and discards the result; the comment says "Testing the route". Leftover test code in a production route: hitting `GET /api/auth/login` returns a 400 every time.
- `src/app/api/auth/logout/route-1.ts` — stray duplicate of `logout/route.ts`. Next only recognizes `route.ts`, so it's inert dead code (it differs only in omitting `revalidatePath`).

### M4. Auth cookies are `httpOnly: false`

`src/utils/supabase/server.ts:25` sets `httpOnly: false` ("Supabase needs client access") with `sameSite: 'lax'`. With this, any XSS on the page can read the Supabase session/refresh tokens from `document.cookie`. The current design does need JS-visible cookies for the browser client (`createClient().auth.*` in `sessionIndexService`, profile forms), but the standard `@supabase/ssr` hardening is to keep tokens httpOnly and drive all auth server-side; the client-side reads that force this tradeoff are few (`auth.getUser`, `auth.updateUser`). Also `server.ts:6` casts the cookie store `as any`, discarding type safety at the most security-sensitive seam. I'd treat this as a deliberate tradeoff to revisit, not a defect — but it should be a conscious, documented decision with the XSS blast radius acknowledged.

### M5. Target-role checks are UI-only in the admin portal

`src/app/(admin)/admin-portal/actions.ts:157–168` — `deleteUser`'s comment says "Only for member users, not admins", but nothing verifies it: the action accepts any `userId` and deletes it with the service-role client. The UI merely *lists* non-superadmins (`getUsers` filters `role != superadmin`), and admins are visible there — so even through the intended UI, an admin can delete other admins, contradicting the comment. Combined with H1 (no caller check), any user can delete anyone. Even after H1 is fixed, the target-role check needs to be in the action. The superadmin portal's `deleteUser`/`editUser` can similarly operate on any user id (including other superadmins) — plausibly intended there, but unstated.

### M6. Pagination approach fetches the entire `user_roles` table per page view

Both `getUsers` implementations (`src/app/(admin)/admin-portal/actions.ts:32–41`, `src/app/(superadmin)/superadmin-portal/actions.ts:32–41`) first select **all** non-superadmin `user_id`s (no `.range()`), then pass them as a `.in("id", allowedIds)` filter. With a realistic user base this produces unbounded PostgREST URL/query sizes (hundreds of IDs in a query string → 4xx errors) and O(all-users) work per page render. Correct behavior today for tiny rosters; a scaling cliff with a hard failure mode. A SQL view or a single join query (RPC) would fix it. Also note the two `actions.ts` files are ~90% identical (`getUsers`/`getUserById` are byte-for-byte duplicates) — see L1.

---

## 5. Findings — Low Severity / Code Quality

**L1. Substantial duplication.**
- `src/app/(admin)/admin-portal/actions.ts` vs `src/app/(superadmin)/superadmin-portal/actions.ts` — `getUsers`/`getUserById` duplicated verbatim; `toTitleCase` triplicated (also in both forms' edit paths).
- Two `ProfileForm` components (`src/app/(members)/members-portal/profile/ProfileForm.tsx`, `src/app/(admin)/profile/ProfileForm.tsx`) share the entire password-change logic.
- `DeleteUserButton.tsx` is duplicated between the admin and superadmin portals and uses `alert()` for errors (`src/app/(admin)/admin-portal/DeleteUserButton.tsx:34`) while the rest of the app uses the toast system.
- `ThemeToggle` vs `ThemeToggler` (documented as intentional: icon vs dropdown).
- Dead navbars: `src/components/global/NavbarLoginReg.tsx` and `NavbarSuperadmin.tsx` have no importers.

**L2. Unused code and dependencies.**
- `stripe` (^22.1.0) and `@heroicons/react` are in `package.json` dependencies with zero imports in `src/` — dead weight in the install (and stripe is a payment SDK in a payments-free app; worth removing purely to reduce the audit surface).
- `src/services/profileService.ts` is never called by application code (only re-exported from `src/services/index.ts`), and its BACKEND_SWAP notes target a table (`adk_n8n_hybrid_profiles`) that doesn't exist in any shipped schema — the persistence concern it addressed was later solved in `chatStore` (localStorage) and `chat_sessions` (DB). Dead module with misleading docs.
- `src/app/(public)/demo/DemoPageContent.tsx` — 361 lines of lorem-ipsum starter demo that additionally uses `next/head` (`:2`), which is inert in the App Router (the `<title>` it sets never applies; App Router requires the metadata API). `src/app/template/` is similar starter cruft. Both are publicly reachable.

**L3. `MessageList` uses array index as React key.** `src/app/(cyberize)/chat/MessageList.tsx:84` — `key={idx}` over a list that is *truncated and re-appended in place* by the edit flow. After an edit truncation, a message at index 5 becomes a different message while React reuses the component instance, so per-item state in `MessageActions`/`ReadAloudButton` (copied-flash, speaking icon) can attach to the wrong message. Low visual impact today, but a classic latent bug; a stable id per message would remove it.

**L4. `useAuthStore` types `user: any` and persists auth state to localStorage.** `src/store/useAuthStore.ts:6` — `user: any` defeats the surrounding TS strictness. The whole state (including `role`, `isAuthenticated`) is persisted under `auth-store` and never re-validated against the server on load, so a stale persisted `role` can drive client-only UI (e.g., the Mission Control link in `CyberizeSidebar.tsx:27`) until the next server round-trip. Server-side `protectPage` prevents actual access, so this is cosmetic, not a security hole — but the store should re-derive or expire its state.

**L5. Login route returns the full session (access + refresh tokens) in the JSON body.** `src/app/api/auth/login/route.ts:61–66` spreads Supabase's `data` (including `session`) into the response. The cookie set already carries the session; the JSON copy adds token surface in JS memory and any proxy logs for no consumer benefit (the client only reads `.user` and `.role`). Suggest returning only the needed subset.

**L6. Miscellaneous.**
- `config/agents.manifest.json:8` — label typo "Harmes Main Agent" (user-visible in the sidebar's agent list).
- `src/app/(admin)/admin-portal/page.tsx` — `Number(pageParam) || 1` accepts negative/huge page numbers (superadmin's `Math.max(1, parseInt(...))` is the safer variant; the two portals should match).
- `src/components/global/Navbar.tsx` — hardcoded third-party Cloudinary URLs for logo/avatar (external single point of failure for a chrome element; `next.config.js` allowlists `res.cloudinary.com` for this). Also defines `NavLink` inside the render body (recreated every render).
- `next.config.js` applies `Cache-Control: no-store` to `/(.*)` — including hashed static assets served from `/_next/static`-adjacent paths caught by the source pattern; combined with the proxy matcher this fights the framework's caching for marginal "freshness" benefit on an app whose data is user-scoped anyway.
- `SessionPanel.commitRename` (`src/components/chat/SessionPanel.tsx:63–73`) fires `renameSession` twice when the user presses Enter (blur follows with the stale `entry.title` still passing the guard) — harmless duplicate write today, an easy dedup.
- `src/utils/get-user-role.ts` is imported by `useAuthStore.ts:3` (as type-only, so it compiles), even though `src/utils/app-role.ts` exists precisely to keep client modules off the server-module chain — fragile; a value import there would break the client build again.
- `src/app/api/auth/login/route.ts:1–8` sets three redundant cache directives (`dynamic`, `revalidate`, `fetchCache`) that all say the same thing.

---

## 6. Concerns, Tradeoffs & Optional Improvements (not defects)

1. **Edit/regenerate diverge from the server transcript by design.** The edit flow (`ChatPageContent.tsx:196–205`) truncates *local* state and re-sends; the ADK session still contains the original messages, so after a reload the transcript shows the old exchange plus the new one appended. Same for regenerate (the resent user message is appended again). This appears to be an accepted phase-3 tradeoff (the store comment says transcripts are server-authoritative), but the UX will visibly "undo" an edit on refresh. Worth documenting or fixing at the ADK layer (message deletion/rewrite is not part of the frozen contract).
2. **Sentinel-as-assistant-message error path.** In live mode, `chatService.sendMessage` never rejects; network/5xx errors come back as a fake assistant message ("Error: Could not reach Agent Service…") appended to the thread (`chatService.ts:55–60`, appended at `ChatPageContent.tsx:160–163`). This is per the documented D1(b) ruling, but the `setError`/`role="alert"` UI in `MessageList` is then mostly unreachable for send failures — the two error mechanisms should be reconciled eventually.
3. **GCS save is last-write-wins with non-atomic backup→write** (`gcsInstructions.ts` — documented as I8). Two admins saving concurrently can interleave backup/write pairs. Acceptable for now; a GCS conditional write (etag/generation match) would make it robust.
4. **`getUsers`' role-map default of `"member"`** for users missing a `user_roles` row (`actions.ts:82`, `:115`) masks a real inconsistency (a user with no role row). Post-H4, the trigger guarantees a row, but the fallback hides failures rather than surfacing them.
5. **Role hierarchy is flat in `protectPage`.** `protectPage([AppRole.ADMIN])` excludes superadmins from `/admin-portal` (`src/app/(admin)/layout.tsx:12`); `protectPage([AppRole.MEMBER])` excludes everyone else from `/members-portal`. If intended ("each role has one portal"), fine — but superadmins needing the admin-portal capabilities must use their own portal. `HomePageContent` tiles suggest both were meant to be reachable. A `role >= required` helper would make the intent explicit.
6. **`console.error` as the failure channel** for all `sessionIndexService` live paths is per the "never block chat" doctrine; a user-invisible failure means a silently missing/restored session list with no telemetry hook.

---

## 7. Positive Observations

- **Service-layer seam discipline** (`src/services/*`, `BACKEND_SWAP_NOTES.md`) is real and consistently honored: UI never touches Supabase/ADK directly for chat concerns, and the mode flag (`isLive()`, anything-but-live = mock) fails safe.
- **`src/config/manifest.ts`** — hand-rolled load-time validation that fails loudly with *all* problems listed; clean design, well-tested, and the routes consistently 400 unknown agents / 500 naming the missing env var.
- **`src/app/api/agent/_lib/adk.ts`** — careful connector: shared deadline budget, per-call caps, retry-exactly-once on the documented not-found signature, reversed-scan response selection, and pure functions that make the module fixture-testable without HTTP.
- **The GCS backup law** (`saveWithBackup`) genuinely aborts the save when the backup fails for any non-404 reason — a rare case of "the comment describes the code."
- **`src/utils/speech.ts`** — well-structured single-owner speech manager; the markdown→prose preparation rules are coherent, and the unmount-cancel semantics in `MessageActions` are handled correctly (ref mirroring the state).
- **`chatStore` FIX-002/FIX-003 work** — mode-namespaced persistence keys, partialize fence keeping message content out of localStorage, and the mismatch-safe `useHydrationReady()` two-pass gate show real attention to SSR/hydration correctness.
- **RLS on `chat_sessions`** correctly enforces per-user index isolation, and the "index is not the transcript" doctrine is enforced in schema and service alike.
- TypeScript compiles cleanly under `strict` across 15k+ lines, and 225 of 263 tests pass with meaningful assertions (the connector tests are genuinely good — they're just aimed at a retired agent roster).

---

## 8. Verification Log

| Command | Result |
|---|---|
| `npx jest` | 36 suites: 26 pass / 10 fail; 263 tests: 225 pass / 38 fail. Root cause of all but one: manifest roster renamed (M1). One test-harness bug (`chatStore.persist.test.ts` SSR-guard simulation). |
| `npx tsc --noEmit` | Clean (exit 0). |
| `npm run lint` | Fails — `next lint` no longer exists in Next 16 (M2). |
| `npx jest <individual failing suites>` | Confirmed failure modes match the manifest-drift analysis (e.g., `agent-run` tests receive 400 "Unknown agent" → zero fetch calls). |
| `node_modules/zustand/middleware.js` inspection | Confirmed the SSR storage-fallback path the persist test intends to exercise is handled (`if (!storage)` warn-branch); the test's simulation is at fault, not the store. |
| Static analysis | Full read of all routes, actions, stores, services, schema SQL, and configuration; targeted greps for dead code, unused deps, and cross-references. |

No files in the target were modified; no git state was changed; `next build` was intentionally skipped to keep the target pristine.

## 9. Coverage Limitations

- **Live-mode behavior was reviewed statically only.** No ADK bundle, Supabase project, or GCS bucket was reachable from this environment, so H2/H3/H4 failure scenarios are argued from code plus schema (and, for H4, the repo's own contradictory docs), not reproduced end-to-end. The unit suite covers the routes only with mocked upstreams.
- **`next build` not run** (would write into the frozen target). Type-check + the full test suite were the compile-level verification.
- Playwright e2e could not be exercised (no config/tests exist — itself finding M2).
- `agent_docs/` process material was used only as factual corroboration (e.g., H4's doc/schema contradiction), not as a review standard.