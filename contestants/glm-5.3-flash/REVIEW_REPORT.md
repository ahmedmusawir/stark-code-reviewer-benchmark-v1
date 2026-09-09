# CR-BENCH-01 Review Report — glm-5.3-flash

**Target:** `target/stark-ai-workbench-nextjs-frontend-v1/`
**Date:** 2026-09-09
**Mode:** Review only. No application code, tests, dependencies, or git state was modified.

---

## 1. Scope and Method

I reviewed the Next.js App Router frontend as a whole, with priority on the security- and correctness-sensitive paths:

- Auth: `src/app/api/auth/*`, `src/utils/supabase/*` (server / browser / admin / middleware clients), `src/proxy.ts`, `src/utils/supabase/actions.ts` (`protectPage`), `src/utils/get-user-role.ts`, `src/store/useAuthStore.ts`, `src/components/auth/LoginForm.tsx`
- Privileged portals: `src/app/(superadmin)/superadmin-portal/actions.ts`, `src/app/(admin)/admin-portal/actions.ts`, layout gating in each route group
- Agent connectors: `src/app/api/agent/run|history|instructions`, `src/app/api/agent/_lib/adk.ts`, `src/app/api/agent/instructions/_lib/gcsInstructions.ts`, `src/config/manifest.ts`, `config/agents.manifest.json`
- Chat: `src/store/chatStore.ts`, `src/services/chatService.ts`, `src/services/sessionIndexService.ts`, `src/app/(cyberize)/chat/*` (ChatPageContent, MessageList, MessageBubble, ChatInput)
- Mission Control: `src/app/(cyberize)/mission-control/*`, `src/services/instructionsService.ts`
- Data layer: `supabase/setup.sql`, `supabase/chat_sessions_setup.sql` (RLS policies, `handle_new_user()` trigger)
- Members/profile: `src/app/(members)/members-portal/profile/ProfileForm.tsx`, `src/services/profileService.ts`
- Config: `next.config.js`, `jest.config.js`, `tsconfig.json`

Verification commands run (non-destructive):

| Command | Result |
| --- | --- |
| `npx jest` (full suite) | **10 suites failed / 26 passed; 38 tests failed / 225 passed** (details in F3) |
| `npx tsc --noEmit` | Clean, no type errors |
| `npx next build` | Fails during prerender of `/` with `@supabase/ssr: Your project's URL and API key are required` — no Supabase env vars in this environment; env-dependent, not conclusive evidence of a code defect (see §5) |
| `git log` / `git status` (read-only) | Used only to understand freeze state |

I could not exercise live Supabase, GCS, or ADK upstream behavior (no credentials in the environment). Findings that depend on runtime services are grounded in the committed code/SQL contracts instead, and are labeled accordingly.

---

## 2. Summary

The codebase is well-organized and unusually well-documented for its size, and much of the hardening is real (RLS policies on `user_roles`, `profiles`, `chat_sessions`; mode-flagged mock/live services; a load-time-validated manifest; backup-before-write on GCS; timeouts on every upstream call). However, the review surfaced two systemic authorization gaps that undermine that hardening, one systemic contract drift around the agent manifest that has left the test suite red and Mission Control pointing at agents that no longer exist, and a database trigger whose committed implementation contradicts the contract its callers rely on.

---

## 3. Demonstrated Problems

Severity ordering is my judgment of realistic impact × exploitability.

### F1 — CRITICAL: Privileged server actions have no authorization; they are publicly invokable POST endpoints

**Files:**
- `src/app/(superadmin)/superadmin-portal/actions.ts` — `addUser` (L126–162), `editUser` (L167–206), `deleteUser` (L211–222), `getUsers` (L23–86), `getUserById` (L91–117)
- `src/app/(admin)/admin-portal/actions.ts` — same five functions (L23–203)

All of these files are marked `"use server"` and are invoked directly from client components (`AddUserForm.tsx:37`, `DeleteUserButton.tsx:29`, `AddMemberForm.tsx`, `EditUserForm`, portal page contents). In Next.js App Router, every export of a `"use server"` module is a public POST endpoint — reachable by anyone with the application's JavaScript, with no requirement to be logged in or hold any role. Authorization is enforced only by the portal *layouts* (`protectPage`, e.g. `src/app/(superadmin)/layout.tsx:12`), which gate page rendering but do **not** protect the action endpoints.

None of the ten exported actions performs any auth or role check. Each calls `createAdminClient()` (`src/utils/supabase/admin.ts`), which uses the **service_role** key and bypasses RLS entirely (the file's own header warns: "This client bypasses Row Level Security (RLS)").

**Failure scenario:** Any unauthenticated visitor can invoke `deleteUser` / `addUser` / `editUser` directly (crafted POST with the action ID from the shipped client bundle), passing an arbitrary `userId`. Because the action runs with the service-role key and no caller check, they can enumerate all users (`getUsers`, including emails), destroy arbitrary accounts (`deleteUser` → `auth.admin.deleteUser` cascades profiles + roles), and create privileged accounts. The same applies to the admin-portal actions, where the comment on `deleteUser` says "Only for member users, not admins" (`admin-portal/actions.ts:154–155`) — there is no such enforcement in the code; any userId passed in is deleted, including admins and superadmins.

**Contrast that confirms intent:** `src/app/api/auth/superadmin-add-user/route.ts:11–26` *does* verify caller identity and superadmin role before touching the admin API. The REST route got the guard; the server actions — which are at least as exposed — did not. Next.js's own guidance is that server actions must be treated as public API endpoints and authorized internally.

**Verification:** static analysis only; the guard's absence is directly observable in the action bodies. `protectPage` (`src/utils/supabase/actions.ts:7–23`) exists but is imported only by layouts, never by any action.

### F2 — CRITICAL: `/api/agent/*` routes are unauthenticated and trust client-supplied `user_id`

**Files:**
- `src/app/api/agent/run/route.ts` (whole file)
- `src/app/api/agent/history/route.ts` (whole file)
- `src/app/api/agent/instructions/route.ts` (whole file)

`src/proxy.ts` (the Next 16 middleware/proxy) only refreshes the session (`updateSession`); it gates nothing. No API route under `src/app/api/agent/` reads the caller's identity.

Consequences:

1. **Transcript disclosure (IDOR).** `POST /api/agent/history` forwards an attacker-chosen `user_id` and `session_id` verbatim into the upstream ADK session URL (`_lib/adk.ts:124–133`, `history/route.ts:44–51`). Anyone on the internet can enumerate `apps/<agent>/users/<user_id>/sessions/<session_id>` and read *any* user's full chat transcript. `user_id` is generated client-side from the persisted Zustand auth store (`ChatPageContent.tsx:36–39`) — there is no server-side binding of `user_id` to the authenticated caller anywhere in the chain.
2. **Unauthenticated agent invocation.** `POST /api/agent/run` runs arbitrary messages against the ADK bundle with a 90-second budget — an unauthenticated compute/abuse/cost vector.
3. **Unauthenticated instruction writes.** `PUT /api/agent/instructions` writes arbitrary content to the live GCS bucket for any manifest-known agent. The code acknowledges this ("Auth posture unchanged this module (I7 — tracked risk, BIM-006 territory)", `instructions/route.ts:11`), but as shipped, an anonymous attacker can silently alter agent instructions that the agents then consume. The backup-before-write law preserves recoverability, not prevention.

The route-level validation that *is* present (manifest-validated agent names, `requireKnownAgent`) is good but covers only the agent-name dimension.

### F3 — HIGH: Agent manifest was replaced without updating dependents — 38 failing tests and Mission Control broken against the live API

**Evidence:** `npx jest` fails 10 suites / 38 tests at the frozen HEAD:

```
FAIL src/__tests__/api/agent-history.test.ts
FAIL src/__tests__/api/agent-run.test.ts
FAIL src/__tests__/api/instructions-route.test.ts
FAIL src/__tests__/chat/AgentSwitcher.test.tsx
FAIL src/__tests__/chat/ChatPageContent.test.tsx
FAIL src/__tests__/chat/chatStore.modeSplit.test.ts
FAIL src/__tests__/chat/chatStore.persist.test.ts
FAIL src/__tests__/chat/MessageList.loading.test.tsx
FAIL src/__tests__/chat/SessionPanel.test.tsx
FAIL src/__tests__/config/manifest.test.ts
```

Root cause is a single divergence: `config/agents.manifest.json` declares `{architect_agent, hermes_agent, designer_agent, devops_agent, ghl_mcp_agent}`, while the tests and hardcoded UI still expect the original set `{greeting_agent, calc_agent, jarvis_agent, product_agent, ghl_mcp_agent}` (see `manifest.test.ts:124–127`: expected `greeting_agent`, received the new list; `agent-run.test.ts:88` expects 2 fetch calls, received 0 because `jarvis_agent` now resolves to 400 "Unknown agent").

This is not just a test-hygiene issue. `src/app/(cyberize)/mission-control/MissionControlPageContent.tsx:12–17` hardcodes `MISSION_CONTROL_AGENTS = ["greeting_agent", "calc_agent", "jarvis_agent", "product_agent"]` — **none of which exist in the manifest**. In live mode (`NEXT_PUBLIC_CHAT_MODE=live`), every Mission Control editor issues `GET/PUT /api/agent/instructions?agent=greeting_agent` etc., which the route rejects with 400 `Unknown agent` (`instructions/route.ts:46–54`). Mission Control is non-functional in live mode at this commit. The mock-mode path (mocks seeded for the old agents) masks this, which is exactly why the drift survived.

### F4 — HIGH: `handle_new_user()` trigger does not honor the contract `addUser` relies on — role silently downgraded, profile name silently dropped

**Files:** `supabase/setup.sql:87–114` vs `src/app/(superadmin)/superadmin-portal/actions.ts:135–162`, `src/app/(admin)/admin-portal/actions.ts:181–189`, `src/app/api/auth/superadmin-add-user/route.ts:32–37`

The committed trigger:

- inserts `user_roles` with **hard-coded `'member'`** (L95–96) — it never reads `role` from metadata;
- populates `profiles.full_name` from `NEW.raw_user_meta_data ->> 'name'` (L103).

But the creators all pass different metadata keys:

- `addUser` sends `user_metadata: { full_name, role }` and its comment states: *"The smart trigger reads 'role' and 'full_name' from metadata and inserts into both user_roles and profiles automatically — no manual inserts needed"* (`superadmin-portal/actions.ts:157–158`). The committed trigger does neither.
- The signup route sends `full_name` (no `name`), and is itself dead code (F9).

**Failure scenario:** a superadmin uses the portal to create an "admin" user. The trigger inserts `role='member'`; the new "admin" is silently an ordinary member, cannot reach `/admin-portal`, and nothing in the action surfaces the divergence (the action returns `{}` success). Similarly `profiles.full_name` is NULL for every admin-created user. The `superadmin-add-user` route partially compensates by manually updating `user_roles` afterward, but still leaves `full_name` NULL — and the route is unused.

Caveat: if the *deployed* database has a newer trigger than `supabase/setup.sql`, the runtime behavior may differ — but then the committed SQL is stale, and either way the code and its schema source-of-truth disagree. This is a demonstrated contract inconsistency; I could not verify the live DB.

### F5 — MEDIUM: Server-side auth cookies forced `httpOnly: false`

**File:** `src/utils/supabase/server.ts:25`

```ts
httpOnly: false, // Supabase needs client access
```

This overrides Supabase SSR's default (`httpOnly: true`) for every auth cookie written server-side (session + refresh tokens). The justification in the comment is wrong: the browser client (`client.ts`, `createBrowserClient`) manages its own token storage; cookies set by the *server* client do not need to be readable by JavaScript. As written, the long-lived refresh token sits in a JS-readable cookie, so any single XSS anywhere (including in markdown-rendered chat content supply chain) yields full session hijacking. Also note `set()` applies `httpOnly: false` while `remove()` does not set it — inconsistent, though remove is less critical.

### F6 — MEDIUM: Mission Control renders fetch-failure text into the editable textarea — one click persists an error string over live instructions

**File:** `src/app/(cyberize)/mission-control/AgentInstructionBlock.tsx:44–50`

On fetch failure the component sets the *editable content* to `` `Error: Could not load instructions for ${agentName}. ${err.message}` `` (deliberately preserving Streamlit-era behavior). The user can then press Save, and `instructionsService.updateInstructions` will happily PUT that error string as the agent's new instructions — overwriting the real prompt on GCS (live mode). The backup law (`gcsInstructions.ts`) makes it recoverable, but a transient GCS read failure followed by a routine save corrupts the live object. The error state should never be seeded into the save path.

### F7 — MEDIUM: Edit-message and regenerate flows only truncate the client transcript; the upstream ADK session keeps the replaced messages

**File:** `src/app/(cyberize)/chat/ChatPageContent.tsx:196–205 (edit), 221–265 (regenerate)`

`handleSubmit` in the edit flow calls `truncateAfterIndex(selectedAgent, editingIndex - 1)` — a purely client-side Zustand operation — then re-sends. `doRegenerate` similarly re-sends the last user message into the *same* live ADK session (`session_id: existing`). In live mode the ADK session's stored events are never truncated or forked:

- After an edit, the model's next reply is conditioned on the *original* message sequence, so the on-screen transcript diverges from the context the model actually has.
- After a regenerate, the resend appends another user turn to the server session; the "new" answer is the model's response to a repeated message, not a regeneration, and server-side history grows with every click.

I could not run a live ADK bundle to observe this; the conclusion follows from the connector code itself (`runAgentFlow` reuses the same `session_id`, `_lib/adk.ts:187–203`) and the absence of any delete/fork session call in the codebase.

### F8 — LOW/MEDIUM: Internal error details leaked to clients

**Files:** `src/app/api/agent/run/route.ts:53`, `history/route.ts:64`, `instructions/route.ts:71,101`; `_lib/adk.ts:151,199,207`

Catch-all handlers return `{ error: String(e) }`, and `ConnectorError` messages embed full upstream response bodies (`Create session failed: ${res.status} ${await res.text()}`). A misconfigured or erroring ADK bundle therefore echoes its internal error bodies (URLs, auth-adjacent diagnostics) to the browser. Combined with F2 (no auth), any anonymous client can probe internal error text.

### F9 — LOW: Dead / debug code left in the auth area

- `src/app/api/auth/login/route.ts:11–27` — an exported **GET** handler labeled "Testing the route" that queries the `posts` table and discards the result. Debug leftover in a production auth endpoint.
- `src/app/api/auth/logout/route-1.ts` — an entire duplicate logout handler; Next.js only recognizes `route.ts`, so this file is dead and its name suggests a copy-paste accident. It is imported by nothing (grep-verified).
- `src/app/api/auth/signup/route.ts`, `src/app/api/auth/confirm/route.ts`, `src/app/api/auth/superadmin-add-user/route.ts`, `src/utils/supabase/fetchUserData.ts` — no references outside themselves (grep-verified). Notably `superadmin-add-user` is the *one* auth mutation with a correct authorization check, and it is unreachable.

---

## 4. Concerns, Tradeoffs, and Optional Improvements

These are not defects I can demonstrate failing; they are judgment calls a team should consciously ratify.

1. **Stale user-facing copy in Mission Control** (`MissionControlPageContent.tsx:26–28`): "Saves to mock storage today; real GCS persistence comes in the backend swap phase" — contradicts `instructionsService`, which has shipped the live GCS path (BIM-005). Misleads operators about where their edits go.
2. **`next/head` in an App Router component** (`src/app/(public)/demo/DemoPageContent.tsx:7`): `next/head` is not supported in the App Router; the `<title>`/meta there are inert. Minor, but it's a pattern that would spread if copied.
3. **`next.config.js:13–22` sets `Cache-Control: no-store` on every route** (`source: "/(.*)"`), including static assets if any responses pass through. It is the nuclear option; it trades cache-hit latency for guaranteed freshness and should be scoped to auth-sensitive dynamic pages.
4. **Role gating is strictly single-role.** `(admin)/layout.tsx` gates `[ADMIN]` only and `(members)/layout.tsx` `[MEMBER]` only, so a superadmin is redirected away from the admin portal and the admin cannot view the member profile area. Possibly intended; worth an explicit decision rather than an accident of `includes()`.
5. **`useAuthStore` (`src/store/useAuthStore.ts`)**: `user: any`; the full user object (including `role`) is persisted to localStorage and is never re-validated against the server on reload — stale `isAuthenticated` survives server-side logout until an API call fails. All actual gating is server-side (`protectPage`), so this is a consistency/UX concern rather than an authz hole.
6. **Copy-paste divergence between the two portal `actions.ts` files.** `getUsers`/`getUserById`/`toTitleCase` are duplicated verbatim; the duplicate-check heuristics already drifted (`superadmin` matches four substrings incl. "duplicate", `admin`'s `addMember` only "already"/"registered"). One divergent fix in one file and not the other is the predictable next bug.
7. **`getUsers` pagination** fetches every non-superadmin `user_id` on every page load to make `count` accurate (`superadmin-portal/actions.ts:32–45`) — O(users) per page view; fine at demo scale, a real cost at production scale.
8. **`newSessionId()` = `session-${Date.now()}`** (`_lib/adk.ts:53`): collisions possible if two sessions for the same user are created within the same millisecond; a `crypto.randomUUID()` would be strictly safer and is free.
9. **chatStore module-scope localStorage access at import time** (`chatStore.ts:46–59`): wrapped in try/catch, so it degrades safely, but it makes import order side effects part of the module's contract; the test suite already has to dance around it (mode-split suite).
10. **ProfileForm initials** (`ProfileForm.tsx:27–31`): `word[0]` on empty split words (double spaces) yields `undefined`, which stringifies into the initials — cosmetic edge case.
11. **jest `testEnvironment: 'node'`** with React component tests relying on per-file jsdom docblocks works, but one missed docblock produces confusing failures (some of the F3 suites render components in node env). Consider `testEnvironment: 'jsdom'` with `docblock` overrides for node-only suites.

---

## 5. Notes on Verification Limits

- `npx next build` fails in this environment because `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are unset at build time (`NavbarHome.tsx:24` creates a browser client during prerender of `/`). With env vars present the build presumably succeeds; I could not confirm, so no finding is asserted from the build failure alone. It does show the public landing page requires Supabase credentials at *build* time, which is a deployability smell (see §4).
- Live Supabase RLS, GCS, and ADK behavior were not exercisable (no credentials). The DB-trigger finding (F4) rests on the committed `supabase/setup.sql` versus the code's stated contract.
- No code, test, config, or git-state changes were made. Working tree left as found.

---

## 6. What I Would Fix First

1. F1 — add a `protectPage([...roles])`-equivalent (or a shared `requireRole` helper) as the first statement of every action in both portal `actions.ts` files. This is the highest-blast-radius, lowest-effort fix in the report.
2. F2 — resolve the server session in `/api/agent/*` (Supabase `getUser`), derive `user_id` from it, and reject mismatches; gate the instructions route on ADMIN/SUPERADMIN.
3. F3 — reconcile the manifest with its dependents (tests, Mission Control list, mocks) in one pass; the test suite is the regression net for everything else and it is currently red.
4. F4 — reconcile the trigger and `addUser` (either teach `handle_new_user()` to read `role`/`full_name`, or update `addUser` to insert the role explicitly like the (unused) `superadmin-add-user` route does).
5. F5 — drop the `httpOnly: false` override; F6 — never seed error text into the save path.