# Code Review Report — `stark-ai-workbench-nextjs-frontend-v1`

**Reviewer:** Independent senior engineer (CR-BENCH-01)
**Date:** 2026-09-09
**Scope:** Review-only. No application code, tests, dependencies, or configuration were modified. No git state was changed.

---

## 1. Summary

The repository is a Next.js 16 (App Router) frontend for an AI agent workbench backed by Supabase Auth + an ADK (Agent Development Kit) native connector. It is a well-structured codebase with a clear service/type/component separation, a manifest-driven agent roster, and a reasonably complete test suite. The review found **no type errors** (`tsc --noEmit` is clean) but **38 failing tests**, all traceable to a single root cause: the agent roster in `config/agents.manifest.json` was changed (BIM-003) without updating the mock data, the Mission Control page, or the tests that assert the old roster.

The most serious findings are **authorization gaps in server actions** and a **role-assignment bug** that silently grants every UI-created user the `member` role regardless of the role selected in the form. These are demonstrated problems, not stylistic concerns.

Findings are ranked most-severe first. Each is classified as **Demonstrated** (a concrete defect with a reproducible failure path) or **Concern** (a risk/tradeoff/optional improvement).

---

## 2. Verification Performed

| Check | Command | Result |
|---|---|---|
| Type check | `npx tsc --noEmit` | Clean (exit 0) |
| Full test suite | `npx jest` | **38 failed / 225 passed** across 10 suites |
| Manifest test | `npx jest src/__tests__/config/manifest.test.ts` | Fails (roster assertions) |
| Agent-run test | `npx jest src/__tests__/api/agent-run.test.ts` | Fails (uses `jarvis_agent`) |
| Dead-code scan | `grep -rn` for unused files/routes | Confirmed `route-1.ts`, `fetchUserData.ts`, `superadmin-add-user` route unused by UI |
| Middleware convention | Inspected `node_modules/next/dist/lib/constants.js` | `proxy.ts` is a valid Next 16 convention (not a bug) |

Live-mode behavior (Supabase, GCS, ADK bundle) could not be exercised end-to-end because no credentials/endpoints are present in the environment; those code paths were reviewed statically.

---

## 3. Findings

### Finding 1 — CRITICAL: Server actions perform privileged operations with no authorization check

**Classification:** Demonstrated
**Files:**
- `src/app/(superadmin)/superadmin-portal/actions.ts` — `addUser` (126–162), `editUser` (167–206), `deleteUser` (211–222)
- `src/app/(admin)/admin-portal/actions.ts` — `editUser` (122–151), `deleteUser` (157–168), `addMember` (173–203)

**Description.** These are Next.js server actions (`"use server"`). Every one of them calls `createAdminClient()` — the Supabase **service-role** client, which bypasses RLS — and performs privileged mutations (create/update/delete auth users, update `user_roles`, update `profiles`) **without ever verifying that the caller is authenticated, let alone authorized for the role the action implies.**

Server actions are directly invocable HTTP endpoints (POST to the page route with a `Next-Action` header). The route-level guard `protectPage([roles])` runs during layout/server-component rendering, but it does **not** gate a server action invoked directly. There is no `getUser()` / `getUserRole()` check inside any of these six functions.

**Contrast that proves the gap:** `src/app/api/auth/superadmin-add-user/route.ts` (lines 6–18) *does* the right thing — it calls `supabase.auth.getUser()`, then `getUserRole(user.id)`, and returns 401/403 before touching the admin client. But that route is **unused by the UI** (grep finds no references outside its own test). The actual UI path is the `addUser` server action, which has no such guard.

**Failure scenario.** Any authenticated user (or, depending on session-cookie handling, a request that merely carries a valid session) can POST the `deleteUser` action with an arbitrary `userId` and delete any account in the system, or invoke `editUser` to promote themselves to `superadmin` by writing to `user_roles`. The service-role client will happily execute it.

**Recommendation.** Add an explicit authorization check at the top of every privileged server action: `const { data: { user } } = await createClient().auth.getUser();` then `getUserRole(user.id)` and reject unless the role matches the action's required role. Do not rely on `protectPage` for server-action authorization.

---

### Finding 2 — HIGH: Agent roster drift breaks 38 tests and live Mission Control

**Classification:** Demonstrated
**Files:**
- `config/agents.manifest.json` (6–12) — declares `architect_agent`, `hermes_agent`, `designer_agent`, `devops_agent`, `ghl_mcp_agent`
- `src/app/(cyberize)/mission-control/MissionControlPageContent.tsx` (12–17) — hardcodes `greeting_agent`, `calc_agent`, `jarvis_agent`, `product_agent`
- `src/mocks/responses.ts`, `src/mocks/data/instructions.ts`, `src/mocks/data/messages.ts`, `src/mocks/data/sessionIndex.ts` — old agent names
- `src/__tests__/config/manifest.test.ts` (118–131) — asserts `KNOWN_AGENTS` contains the old five names
- `src/__tests__/api/agent-run.test.ts` (34) — uses `agent_name: 'jarvis_agent'`
- `src/__tests__/chat/chatStore.persist.test.ts`, `chatStore.modeSplit.test.ts` — expect default agent `greeting_agent`

**Description.** The manifest is the single source of truth for the agent roster (`src/config/manifest.ts` derives `KNOWN_AGENTS` and `DEFAULT_AGENT` from it). The manifest now lists five agents, none of which are the four names hardcoded in Mission Control or the names used throughout the mocks and tests.

**Consequences (all demonstrated):**

1. **38 failing tests** across 10 suites. The manifest test's "committed manifest" block (lines 118–131) asserts the original five names (`greeting_agent`, `jarvis_agent`, `calc_agent`, `product_agent`, `ghl_mcp_agent`) are present in `KNOWN_AGENTS`; four of them are not. The agent-run test uses `jarvis_agent`, which `resolveBundleEnvVar` returns `null` for, so the route returns 400 and the test's happy-path assertions fail. The chat-store tests expect `DEFAULT_AGENT === 'greeting_agent'` but the manifest's first agent is now `architect_agent`.

2. **Live Mission Control is broken.** `MissionControlPageContent.tsx` maps over `MISSION_CONTROL_AGENTS` and renders an `AgentInstructionBlock` per agent. In live mode, `fetchInstructions`/`updateInstructions` resolve against the manifest/backend; the four hardcoded names are not in the manifest, so instruction load/save for those agents fails (the run route would return 400 for them). The page's own comment (lines 7–11) claims this drift is "deliberate" per `DATA_CONTRACT.md §4`, but the manifest change (BIM-003) has invalidated that assumption — the drift is no longer a cosmetic omission of `ghl_mcp_agent`; it is now a total mismatch.

**Recommendation.** Reconcile the roster in one place. Either update Mission Control to render `agentsForUi()` from the manifest (the manifest loader already exposes exactly this), or update the manifest to match the four agents the product actually ships. Then update the mocks and the roster-asserting tests. The manifest test's own comment (lines 113–117) claims it is "roster-agnostic by design," but the assertion at lines 119–127 is not roster-agnostic — it hardcodes the old five names, which is the direct cause of the failure.

---

### Finding 3 — HIGH: `addUser` silently ignores the selected role (every UI-created user becomes `member`)

**Classification:** Demonstrated
**Files:**
- `src/app/(superadmin)/superadmin-portal/actions.ts` (126–162)
- `supabase/setup.sql` (87–108) — `handle_new_user()` trigger

**Description.** `addUser` packs the selected role into `user_metadata` (lines 139–142: `role: formData.role`) and then relies on the DB trigger to populate `user_roles`. But the trigger hardcodes the role:

```sql
INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member');
```

It never reads `raw_user_meta_data ->> 'role'`. The comment in `addUser` (lines 157–158) states *"The smart trigger reads 'role' and 'full_name' from metadata and inserts into both user_roles and profiles automatically"* — this is **false**. The trigger reads neither.

**Failure scenario.** A superadmin uses the portal to create a user with role `admin` (or `superadmin`). The auth user is created, the trigger fires, and the new user is inserted into `user_roles` with `role = 'member'`. The new user cannot access the admin portal, and the superadmin's role selection is silently discarded. The only way to fix it is a manual `UPDATE user_roles` (the same manual step the setup.sql comments describe for the first superadmin).

**Recommendation.** After `createUser` succeeds, explicitly `UPDATE user_roles SET role = formData.role WHERE user_id = <new id>` (as the unused `superadmin-add-user` route already does at lines 45–48), or fix the trigger to read `role` from metadata. The misleading comment must be corrected either way.

---

### Finding 4 — HIGH: `profiles.full_name` is always `null` (metadata key mismatch)

**Classification:** Demonstrated
**Files:**
- `supabase/setup.sql` (99–104) — trigger reads `raw_user_meta_data ->> 'name'`
- `src/app/api/auth/signup/route.ts` (12–16) — writes `full_name`
- `src/app/(superadmin)/superadmin-portal/actions.ts` (139–142) — writes `full_name`
- `src/app/(admin)/admin-portal/actions.ts` (185–188) — writes `full_name`

**Description.** Every code path that creates a user writes the display name under the metadata key `full_name`. The trigger, however, reads `NEW.raw_user_meta_data ->> 'name'`:

```sql
INSERT INTO public.profiles (id, email, full_name)
VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'name');
```

Since no path ever writes a `name` key, `full_name` is always `NULL` in `profiles` for every user created through signup or the portals.

**Failure scenario.** The user list (`getUsers`) reads `profiles.full_name` and renders it. Every row shows an empty name. The `editUser` action can later patch `full_name` directly (lines 185–188), so the field is only ever populated after a manual edit — never at creation.

**Recommendation.** Change the trigger to read `raw_user_meta_data ->> 'full_name'` (matching all three writers), or standardize on `name` everywhere. Pick one key and use it consistently.

---

### Finding 5 — MEDIUM: Admin `deleteUser` has no role guard despite its own comment

**Classification:** Demonstrated
**File:** `src/app/(admin)/admin-portal/actions.ts` (153–168)

**Description.** The comment (lines 154–155) states *"Only for member users, not admins."* But the function body simply calls `adminClient.auth.admin.deleteUser(userId)` with no check on the target user's role. The admin portal's `getUsers` (lines 23–86) lists **all non-superadmin** users — which includes other `admin`-role users. So an admin can delete another admin.

**Failure scenario.** Admin A opens the portal, sees Admin B in the list (both are non-superadmin), and deletes them. The comment's stated invariant is not enforced anywhere.

**Recommendation.** Before deleting, fetch the target's role and reject if it is `admin` (or `superadmin`). Alternatively, filter the admin portal's `getUsers` to `role = 'member'` only, so admins never appear as deletable rows.

---

### Finding 6 — MEDIUM: Login route leaks the full session (access/refresh tokens) in the response body

**Classification:** Demonstrated
**File:** `src/app/api/auth/login/route.ts` (61–66)

**Description.** The POST handler returns:

```ts
const res = NextResponse.json({ data: { ...data, role } }, { status: 200 });
```

where `data` is the result of `supabase.auth.signInWithPassword(...)`, i.e. `{ user, session }`. Spreading `data` into the response body serializes the entire `session` object — including `access_token` and `refresh_token` — into the JSON returned to the browser. The client (`useAuthStore.login`, lines 33–34) only needs `data.user` and `data.role`.

**Why this matters.** The tokens are already set as HTTP-only cookies by the Supabase SSR client, so exposing them again in the response body is redundant and increases the attack surface: the tokens now transit in a JSON body that may be logged by proxies, error-reporting middleware, or browser devtools, and are readable by any client-side script that can observe the fetch response.

**Recommendation.** Return only the fields the client needs: `{ data: { user: data.user, role } }`. Do not spread the session.

**Secondary issue (same file):** the `GET` handler (lines 11–27) queries a `posts` table that does not exist in the schema (`supabase/setup.sql` defines only `user_roles`, `profiles`, and `chat_sessions`). It is leftover test scaffolding ("Testing the route") and will always return a 400 in a real environment. It should be removed.

---

### Finding 7 — LOW: Dead code

**Classification:** Concern
**Files:**
- `src/app/api/auth/logout/route-1.ts` — duplicate/abandoned logout route (the live route is `route.ts` in the same directory)
- `src/utils/supabase/fetchUserData.ts` — unused helper (no imports anywhere)
- `src/app/api/auth/superadmin-add-user/route.ts` — unused by the UI (only referenced by its own test); the correct auth-checked logic it contains is bypassed in favor of the unguarded `addUser` server action (see Finding 1)
- `src/store/useAuthStore.ts` (9, 20) — `isLoading` is initialized to `true` and never set to `false` or read anywhere; it is dead state

**Recommendation.** Remove the dead files and the unused `isLoading` field, or wire them up. The `superadmin-add-user` route is the most important: it is the *correct* implementation that the UI should be using, and its existence alongside the broken `addUser` action is a maintenance hazard.

---

### Finding 8 — LOW: `getUsers` / `getUserById` duplicated verbatim across two portals

**Classification:** Concern
**Files:**
- `src/app/(superadmin)/superadmin-portal/actions.ts` (23–117)
- `src/app/(admin)/admin-portal/actions.ts` (23–117)

**Description.** The two `getUsers` and `getUserById` implementations are byte-for-byte identical (both fetch non-superadmin roles, paginate profiles, and merge roles in JS). The only differences between the two files are in the mutation functions (`editUser`/`deleteUser`/`addUser` vs `addMember`). This duplication means any fix to the pagination/merge logic must be applied twice, and the two copies have already drifted in intent (the admin portal's `deleteUser` comment claims a member-only invariant that the superadmin portal's does not).

**Recommendation.** Extract the shared read functions into a single module (e.g. `src/services/userAdminService.ts` or a shared `actions/shared.ts`) and import from both portals.

---

### Finding 9 — LOW: `next/head` used in App Router pages (deprecated)

**Classification:** Concern
**Files:**
- `src/app/(public)/demo/DemoPageContent.tsx`
- `src/app/template/TemplatePageContent.tsx`

**Description.** These files import `next/head`, which is a Pages Router API. In the App Router, document metadata is set via the `metadata` export or the `Metadata` API; `next/head` is deprecated and does not behave as expected in App Router components.

**Recommendation.** Replace with the App Router `metadata` export (for static metadata) or `generateMetadata` (for dynamic), or use the `Head` component from `next/document` only where actually appropriate.

---

## 4. What Was Not Reviewed / Limitations

- **Live end-to-end behavior** (Supabase auth round-trip, GCS instruction persistence, ADK bundle `api_server` calls) could not be exercised because no credentials or bundle endpoints are present in this environment. Those paths were reviewed statically.
- **RLS policy correctness** was reviewed against the SQL in `supabase/setup.sql` and `supabase/chat_sessions_setup.sql`; the policies are coherent (per-user `auth.uid()` checks, no DELETE policy by design), but their runtime enforcement was not tested against a live Supabase instance.
- The `supabase/chat_sessions_setup.sql` table and its `UNIQUE (user_id, agent_name, adk_session_id)` constraint and index were reviewed and appear correct; no issue found.

---

## 5. Conclusion

The codebase is structurally sound and type-clean, but it currently ships with a **broken test suite (38 failures)** and two **authorization/role defects** that would be visible to any user of the admin/superadmin portals. The highest-priority fixes are, in order:

1. Add authorization checks to all privileged server actions (Finding 1).
2. Fix the role-assignment path so UI-created users get the role they were assigned (Finding 3).
3. Reconcile the agent roster across manifest, Mission Control, mocks, and tests (Finding 2).
4. Fix the `full_name` metadata key mismatch (Finding 4).
