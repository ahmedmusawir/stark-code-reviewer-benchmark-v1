# CR-BENCH-01 — Senior Code Review Report

**Contestant:** deepseek-v4-flash
**Target:** `target/stark-ai-workbench-nextjs-frontend-v1/`
**Date:** 2026-09-09
**Review type:** Raw senior code review (no predefined checklist)

---

## 1. Executive Summary

This is a Next.js 16 (App Router) frontend for an AI agent workbench ("Stark AI Workbench") that talks to Google ADK agent bundles, stores agent instructions in GCS, and manages users via Supabase with an RBAC model (`superadmin` / `admin` / `member`).

The most serious problems are **authorization gaps on the server side**. The admin and superadmin portals are implemented as Next.js **server actions** that use the Supabase **service-role key** with **no caller authorization check whatsoever**. The `protectPage()` helper only gates *page rendering*; it does not protect the actions, which are directly POSTable. The same pattern is repeated in the three `/api/agent/*` route handlers (`run`, `history`, `instructions`), which are completely unauthenticated and accept client-supplied `user_id` / `session_id` / instruction content. A properly-protected route (`/api/auth/superadmin-add-user`) exists in the same codebase and demonstrates the intended pattern — it was simply not applied to the server actions or the agent API.

A second cluster of problems is **manifest/agent-name drift** (BIM-003): the committed `config/agents.manifest.json` declares a new agent set, but the test suite, mock data, and the Mission Control page still reference the old agent names. The result is a **red test suite (10 suites / 38 tests failing)** and a Mission Control page that is **broken in live mode** (every agent it renders returns HTTP 400 "Unknown agent").

A third cluster is **data-layer correctness**: the `handle_new_user()` trigger reads a metadata key (`name`) that the application never writes (it writes `full_name`), so `profiles.full_name` is always NULL for users created through the admin/superadmin portals; the same trigger hardcodes role `member` and silently discards the role the superadmin portal's add-user form selects.

Findings are grouped below as **Demonstrated Problems** (with evidence) and **Concerns / Tradeoffs / Optional Improvements**. Severity is my judgment as a senior reviewer.

---

## 2. Review Scope & Method

I reviewed the repository as it exists on disk (frozen target). I did not modify any file inside `target/`.

**What I examined:**
- All route handlers under `src/app/api/` (auth, agent, and the `_lib` connector code).
- All server actions (`src/app/(admin)/admin-portal/actions.ts`, `src/app/(superadmin)/superadmin-portal/actions.ts`, `src/utils/supabase/actions.ts`).
- Supabase client factories (`src/utils/supabase/{server,client,admin,middleware}.ts`), role helpers (`src/utils/get-user-role.ts`, `src/utils/app-role.ts`).
- Database schema (`supabase/setup.sql`, `supabase/chat_sessions_setup.sql`).
- Agent manifest and loader (`config/agents.manifest.json`, `src/config/manifest.ts`).
- Chat / Mission Control UI and services (`src/app/(cyberize)/**`, `src/services/*`, `src/store/*`, `src/mocks/*`).
- The full Jest test suite and the TypeScript typecheck.
- Middleware (`src/proxy.ts`) and build output to confirm it is active in Next.js 16.

**Verification run:**
- `npx tsc --noEmit` — **passes** (no type errors).
- `npx jest` — **10 suites failed, 26 passed (36 total); 38 tests failed, 225 passed (263 total)**.
- Static analysis of the authorization paths (see findings).

**Limitation:** No `.env.local` credentials are present, so live-mode behavior against real Supabase / GCS / ADK backends could not be exercised. Findings about live-mode behavior are verified statically and, where possible, against the unit test suite. This did not prevent review of any part of the system.

---

## 3. Demonstrated Problems

### CRITICAL

#### C1. Admin portal server actions are unauthenticated and use the service-role key

**Files:** `src/app/(admin)/admin-portal/actions.ts` (all exports), `src/utils/supabase/admin.ts`

Every exported action in the admin portal — `getUsers` (line 23), `getUserById` (line 91), `editUser` (line 122), `deleteUser` (line 157), `addMember` (line 173) — calls `createAdminClient()` (service-role, bypasses RLS) and performs the operation with **no check that the caller is authenticated, let alone an admin**.

- `deleteUser` (line 157) calls `adminClient.auth.admin.deleteUser(userId)` for an arbitrary `userId`. The comment on line 154 says "Only for member users, not admins" but there is **no guard** — any caller can delete any user, including admins and superadmins.
- `addMember` (line 173) creates arbitrary users with `email_confirm: true`.
- `editUser` (line 122) updates arbitrary users' names via the admin API.
- `getUsers` / `getUserById` enumerate all non-superadmin users' emails, names, and roles.

**Why the layout gate does not protect these:** `protectPage()` (`src/utils/supabase/actions.ts:7`) is called from the portal *layouts* and only gates page rendering. Next.js server actions are invoked by a direct `POST` to the page path with an action ID embedded in the client bundle; they never pass through the layout. Any authenticated user (or an unauthenticated attacker who extracts the action ID from the publicly-served JS chunk) can invoke these actions directly.

**Contrast proving the intended pattern:** `src/app/api/auth/superadmin-add-user/route.ts:6-18` verifies `getUserRole(user.id) === "superadmin"` before touching the admin client. The same check is absent from every server action.

**Realistic failure scenario:** A `member` user calls `deleteUser("<superadmin-uuid>")` (or `editUser` on their own row to change metadata, or `getUsers` to harvest every email in the tenant). Full account takeover of the tenant is possible.

---

#### C2. Superadmin portal server actions are unauthenticated and allow arbitrary role assignment (privilege escalation)

**Files:** `src/app/(superadmin)/superadmin-portal/actions.ts` (all exports)

Same pattern as C1: `getUsers` (line 23), `getUserById` (line 91), `addUser` (line 126), `editUser` (line 167), `deleteUser` (line 211) all use `createAdminClient()` with no caller check.

Worse, `editUser` (line 167) writes `formData.role` **verbatim** into `user_roles.role` (line 197) with no validation that the value is one of the allowed enum values. A caller can set any user's role to `'superadmin'` — including their own account — by passing `role: "superadmin"`. This is direct privilege escalation to the highest role in the system.

`addUser` (line 126) also accepts a client-supplied `role` and passes it into `user_metadata` (line 141), though (see F3) the trigger ignores it.

**Realistic failure scenario:** A `member` POSTs the superadmin `editUser` action with their own `user_id` and `role: "superadmin"`. They are now a superadmin and can do everything the portal does, plus everything C1 enables.

---

#### C3. `/api/agent/run` is unauthenticated and trusts client-supplied `user_id`

**File:** `src/app/api/agent/run/route.ts`

`POST /api/agent/run` (line 25) reads `authorization` into a local variable (line 26, "reserved auth slot (R2)") and **never validates it**. The request body supplies `agent_name`, `user_id`, and `message`; the route forwards them to the ADK bundle via `runAgentFlow` (line 47). There is no check that the caller is authenticated, that `user_id` belongs to the caller, or that the caller is allowed to run the named agent.

**Realistic failure scenarios:**
- **Cross-user session contamination / impersonation:** an attacker sends `user_id: "<victim-uuid>"` and a `session_id` they guess (see C5) to read or continue a victim's conversation, or to plant messages in it.
- **Resource abuse / cost:** the route is a public proxy to the ADK backend. Anyone can drive unbounded agent runs (each up to 90s, `maxDuration = 90`), consuming backend compute and any per-request cost.

---

#### C4. `/api/agent/history` is unauthenticated — IDOR on chat transcripts

**File:** `src/app/api/agent/history/route.ts`

`POST /api/agent/history` (line 22) fetches the ADK session at `sessionUrl(baseUrl, agent_name, user_id, session_id)` (line 44-51) and returns the normalized transcript. `user_id` and `session_id` come entirely from the request body. No authentication, no ownership check.

**Realistic failure scenario:** Combined with the predictable session IDs (C5), an attacker enumerates `session_id` values for a victim `user_id` and reads the victim's full chat history — including any sensitive content the user typed to the agents. This is a textbook IDOR.

---

#### C5. Predictable session IDs enable session enumeration

**File:** `src/app/api/agent/_lib/adk.ts:53`

```ts
export const newSessionId = (): string => `session-${Date.now()}`;
```

Session IDs are `session-<epoch-ms>`. They are sequential and guessable within a small window. Because the history endpoint (C4) and run endpoint (C3) are unauthenticated and accept arbitrary `session_id` values, an attacker can:
1. Observe one session ID (e.g., from their own run) to calibrate the clock.
2. Brute-force a narrow millisecond window around a victim's activity to recover their session IDs.
3. Read the victim's transcripts via `/api/agent/history`.

Even if the API routes were later authenticated, predictable session IDs are a latent risk if session IDs are ever used as bearer tokens or in URLs that leak (referrer, logs).

---

#### C6. `/api/agent/instructions` GET+PUT is unauthenticated — anyone can rewrite production agent instructions

**File:** `src/app/api/agent/instructions/route.ts`

- `GET` (line 56) returns the instruction blob for any known agent.
- `PUT` (line 75) writes `body.content` to GCS for any known agent (with backup-before-write via `saveWithBackup`).

Neither handler authenticates the caller. The file's own header comment acknowledges this: *"Auth posture unchanged this module (I7 — tracked risk, BIM-006 territory)."* (line 11).

**Realistic failure scenario:** An unauthenticated attacker `PUT`s a malicious system prompt for `architect_agent` (or any manifest agent). Every subsequent user conversation with that agent is steered by attacker-controlled instructions — prompt injection at the system level, plus data-exfiltration instructions to the agent. The backup-before-write law (I3) preserves the prior blob, but the *active* instructions are overwritten until someone restores them. This is the highest-impact single finding: it changes the behavior of the product's core AI surface for all users.

---

### HIGH

#### H1. Test suite is red: 10 suites / 38 tests failing (manifest drift)

**Evidence:** `npx jest` → `Test Suites: 10 failed, 26 passed, 36 total; Tests: 38 failed, 225 passed, 263 total`.

**Root cause:** `config/agents.manifest.json` (BIM-003) declares `architect_agent, hermes_agent, designer_agent, devops_agent, ghl_mcp_agent`. The tests, mocks, and Mission Control page still reference the old names (`greeting_agent, jarvis_agent, calc_agent, product_agent`). Example failure:

```
src/__tests__/chat/ChatPageContent.test.tsx:77
  const input = await screen.findByPlaceholderText(/ask greeting_agent/i);
```

The app now renders `Ask architect_agent...` (default agent from the manifest), so the placeholder never appears. The same drift breaks `agent-run.test.ts`, `agent-history.test.ts`, `instructions-route.test.ts`, `AgentSwitcher.test.tsx`, and others (all listed in §5).

**Impact:** The repository ships with a failing test suite. Any CI gate on `jest` is red, and the tests no longer describe the behavior of the shipped app. This is a demonstrated, reproducible defect — not a style concern.

---

#### H2. Mission Control page is broken in live mode (hardcoded agents not in the manifest)

**File:** `src/app/(cyberize)/mission-control/MissionControlPageContent.tsx:12-17`

```ts
const MISSION_CONTROL_AGENTS: AgentName[] = [
  "greeting_agent",
  "calc_agent",
  "jarvis_agent",
  "product_agent",
];
```

None of these four names exist in `config/agents.manifest.json`. In live mode, `AgentInstructionBlock` → `instructionsService.fetchInstructions` → `GET /api/agent/instructions?agent=greeting_agent` → `requireKnownAgent` returns **HTTP 400 "Unknown agent"** (`route.ts:46-54`). Every block on the page renders a fetch failure. The page is entirely non-functional in live mode.

The comment on lines 8-10 acknowledges the *deliberate* omission of `ghl_mcp_agent` ("preserving the drift from the Streamlit original"), but the actual defect is broader: **all four** hardcoded agents are stale, not just the omitted one. The manifest is the declared single source of truth (BIM-003), and this page bypasses it.

---

#### H3. `handle_new_user()` trigger reads the wrong metadata key — `profiles.full_name` is always NULL

**File:** `supabase/setup.sql:87-108` (trigger), vs. the app's writes.

The trigger reads:
```sql
NEW.raw_user_meta_data ->> 'name'   -- setup.sql:103
```
The application writes `full_name`:
- `src/app/(admin)/admin-portal/actions.ts:186` → `user_metadata: { full_name: fullName, role: "member" }`
- `src/app/(superadmin)/superadmin-portal/actions.ts:140` → `user_metadata: { full_name: fullName, role: formData.role }`

So `profiles.full_name` is **always NULL** for users created through the admin/superadmin portals. The admin portal's user list (`getUsers` selects `full_name`) will show blank names for every user created this way. (Users who sign up via the auth flow may also be affected if the signup path writes `full_name` rather than `name` — the trigger is the single point of truth and it reads the wrong key.)

**Secondary defect in the same trigger:** it hardcodes `role = 'member'` (setup.sql:95-96) and ignores the `role` metadata key that `addUser` sets. The comment in `superadmin-portal/actions.ts:157-158` claims *"The smart trigger reads 'role' and 'full_name' from metadata and inserts into both user_roles and profiles automatically"* — but the trigger does **not** read `role`. Creating an "admin" user through the superadmin portal therefore **silently creates a member**. The role picker in the add-user form is a no-op.

---

### MEDIUM

#### M1. Leftover test code in the login GET handler queries a nonexistent table

**File:** `src/app/api/auth/login/route.ts:11-27`

The `GET` handler (labeled "Testing the route", line 10) runs `supabase.from("posts").select("*")`. There is no `posts` table in `supabase/setup.sql` or `chat_sessions_setup.sql`. Any `GET /api/auth/login` therefore returns HTTP 400 with the PostgREST error. This is leftover scaffolding that should have been removed; it also leaks schema/error details to unauthenticated callers.

---

#### M2. Dead duplicate logout route

**File:** `src/app/api/auth/logout/route-1.ts`

`route-1.ts` is a full duplicate of `route.ts` but is not a valid route handler (Next.js only recognizes `route.ts`). It is dead code that will confuse future maintainers (which file is live?) and can silently diverge. Should be deleted.

---

#### M3. Unvalidated `next` parameter in the email-confirm route (open redirect)

**File:** `src/app/api/auth/confirm/route.ts:10-13`

```ts
const next = searchParams.get("next") ?? "/";
const redirectTo = request.nextUrl.clone();
redirectTo.pathname = next;
```

`next` is taken from the query string and assigned directly to `pathname`. A value like `//evil.com` (protocol-relative) or `/\evil.com` can redirect the browser off-site after a successful email verification. The redirect only fires on a successful `verifyOtp`, so the practical exposure is limited to phishing links that first complete a real confirmation — but the parameter should be validated against an allowlist of internal paths (the standard Supabase starter pattern does exactly this).

---

#### M4. Mock data is keyed to agent names that no longer exist in the manifest

**Files:** `src/mocks/responses.ts`, `src/mocks/data/messages.ts`, `src/mocks/data/sessionIndex.ts`, `src/mocks/data/instructions.ts`

All four mock modules are keyed on `greeting_agent / jarvis_agent / calc_agent / product_agent / ghl_mcp_agent`. The app's default agent is now `architect_agent` (manifest order, `src/config/manifest.ts:99`). Consequences in mock mode (the default, `NEXT_PUBLIC_CHAT_MODE` unset):
- The seeded conversations (`messages.ts`) and seeded session-index rows (`sessionIndex.ts`) are unreachable — the session panel shows empty for the default agent.
- The per-agent showcase responses (`responses.ts`) are dead; the generic `default` branch (line 127) covers the manifest agents, so chat still "works" but the curated content is gone.
- Mission Control's mock instruction editor (`instructions.ts`) shows nothing for the manifest agents.

This is the same drift as H1/H2, manifesting in the default (mock) experience.

---

### LOW

#### L1. Public `/demo` starter page left in the tree

**File:** `src/app/(public)/demo/page.tsx`

A leftover starter/demo page in the public route group. Harmless but should be removed or gated before production.

#### L2. `MessageList` uses array index as React key

**File:** `src/app/(cyberize)/chat/MessageList.tsx:84` — `key={idx}`.

The chat supports edit/truncate/regenerate flows (`ChatPageContent.tsx:196-265`), which mutate the message array in the middle. Index keys can cause React to reuse the wrong DOM nodes (e.g., stale scroll position, focus, or copy-button state) when messages are truncated and re-appended. Low severity because the bubbles are stateless, but a stable per-message key would be more robust.

---

## 4. Concerns, Tradeoffs, and Optional Improvements

These are not demonstrated defects but observations a senior reviewer should surface.

- **Global `Cache-Control: no-store` on every route** (`next.config.js`). This is a blunt instrument. It is defensible for an auth-heavy app, but it also disables caching for static assets and public pages, and it is redundant with the per-route headers already set in the auth routes. Consider scoping it to authenticated routes and letting static assets cache normally.

- **`getUserRole` creates a fresh Supabase client per call** (`src/utils/get-user-role.ts:19`). `protectPage` and every layout call it; each invocation spins up a new `@supabase/ssr` client. Minor overhead, but a shared server-side client would be cleaner.

- **`useAuthStore` persists the full user object to `localStorage`** (`src/store/useAuthStore.ts`). Client-side only, so not a server leak, but it stores PII (email) in browser storage and can go stale relative to the server session. A minimal persisted shape (id + role) would be safer.

- **`chat_sessions` has no DELETE policy by design** (`supabase/chat_sessions_setup.sql:46-48`). Sessions are archive-only in v1. This is a documented product decision, but it means the `archived` flag is the only cleanup mechanism and there is no purge job yet — worth a ticket before data grows.

- **`/api/agent/run` and `/api/agent/history` forward an `Authorization` header verbatim** (`adk.ts:114-119`). The header is read but never validated ("reserved slot R2"). If a caller supplies an arbitrary `Authorization` value, it is forwarded to the ADK backend. This is fine as a pass-through design, but it must not be mistaken for authentication — the routes remain unauthenticated (C3/C4).

- **`extractResponseText` / `normalizeHistory` degrade to `[]` / `null` on malformed upstream data** (`adk.ts:65-95`). Good defensive behavior; the run route surfaces "No model response in events" as a 502. Reasonable.

- **`next.config.js` `images.remotePatterns` allows only `res.cloudinary.com`.** If the app later renders agent-provided images, this will need revisiting; not a current defect.

---

## 5. Verification Evidence

| Check | Command | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | ✅ Passes |
| Test suite | `npx jest` | ❌ 10 suites failed / 38 tests failed (26 suites / 225 tests passed) |
| Middleware active | `src/proxy.ts` + `.next/server/middleware.js` + `PROXY_FILENAME` in Next constants | ✅ `proxy.ts` is the active Next 16 middleware |
| Manifest contents | `config/agents.manifest.json` | `architect_agent, hermes_agent, designer_agent, devops_agent, ghl_mcp_agent` |
| Failing test example | `src/__tests__/chat/ChatPageContent.test.tsx:77` | Waits for `Ask greeting_agent` placeholder; app renders `Ask architect_agent...` |

**Failing test suites (10):** `chat/ChatPageContent.test.tsx`, `chat/ChatPageContent.hydration.test.tsx`, `chat/AgentSwitcher.test.tsx`, `chat/chatStore.modeSplit.test.ts`, `chat/chatStore.persist.test.ts`, `chat/chatStore.sessions.test.ts`, `api/agent-run.test.ts`, `api/agent-history.test.ts`, `api/instructions-route.test.ts`, `mission-control/MissionControlPageContent.test.tsx` (plus others referencing stale agent names — full list in the jest output).

---

## 6. Findings Summary

| ID | Severity | Area | One-line summary |
|----|----------|------|------------------|
| C1 | Critical | AuthZ | Admin portal server actions use service-role key with no caller check |
| C2 | Critical | AuthZ | Superadmin portal actions unauthenticated; `editUser` allows arbitrary role incl. `superadmin` |
| C3 | Critical | AuthZ | `/api/agent/run` unauthenticated, trusts client `user_id` |
| C4 | Critical | AuthZ | `/api/agent/history` unauthenticated IDOR on transcripts |
| C5 | Critical | AuthZ | Predictable `session-<Date.now()>` IDs enable session enumeration |
| C6 | Critical | AuthZ | `/api/agent/instructions` GET+PUT unauthenticated — anyone can rewrite agent prompts |
| H1 | High | Tests | 10 suites / 38 tests failing from manifest/agent-name drift |
| H2 | High | Correctness | Mission Control hardcodes agents absent from manifest → broken in live mode |
| H3 | High | Data | Trigger reads `name` metadata key; app writes `full_name` → names always NULL; role silently dropped |
| M1 | Medium | Hygiene | Login GET queries nonexistent `posts` table |
| M2 | Medium | Hygiene | Dead duplicate `logout/route-1.ts` |
| M3 | Medium | Security | Unvalidated `next` param in confirm route (open redirect) |
| M4 | Medium | Correctness | Mock data keyed to stale agent names; default-agent experience degraded |
| L1 | Low | Hygiene | Public `/demo` starter page left in tree |
| L2 | Low | UI | `MessageList` uses index as React key |

---

## 7. Operator Notes

1. **Review complete.**
2. **Verification/tests run:** `npx tsc --noEmit` (passes); `npx jest` (10 suites / 38 tests failing — root cause identified as manifest drift); static analysis of all API routes, server actions, Supabase schema, and the agent connector. Live-mode behavior against real Supabase/GCS/ADK backends was not exercised (no credentials present); findings there are verified statically.
3. **Report path:** `contestants/deepseek-v4-flash/REVIEW_REPORT.md`
4. **Anything preventing review:** No. The only limitation is the absence of live backend credentials, which prevented end-to-end verification of live-mode behavior; this did not block review of any part of the system.
