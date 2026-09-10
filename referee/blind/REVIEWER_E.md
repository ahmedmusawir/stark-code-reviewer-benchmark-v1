# CR-BENCH-01 — Code Review Report

**Target:** `target/stark-ai-workbench-nextjs-frontend-v1/`  
**Reviewer:** [BLINDED REVIEWER] (contestant run)  
**Date:** 2026-09-09  
**Scope:** Full-stack Next.js 16 frontend (App Router, React 19, TypeScript, Supabase SSR, Zustand, Tailwind, shadcn/ui). Review focused on correctness, security, maintainability, test health, and build/deploy readiness.

---

## Executive Summary

The repository has a clean component/service split and a well-documented data contract, but it is currently in a **partially broken state** because the agent manifest was swapped to a new roster while the rest of the codebase (tests, mocks, Mission Control, seeded histories) still assumes the old roster. The test suite fails on 38 of 263 tests, the production build cannot complete without environment variables because Supabase clients are instantiated during render, and several auth/session/security gaps remain unaddressed.

The most important issues to fix before shipping are:

1. Reconcile the agent manifest with the code/tests/mocks (or revert the manifest change).
2. Wire a real Next.js middleware for Supabase session refresh.
3. Authenticate/authorize the internal agent API routes.
4. Fix the build-time Supabase client instantiation in the navbars.
5. Repair the auth store `isLoading` persistence bug.

---

## Verification Performed

| Command | Result | Notes |
|---|---|---|
| `npm ci` | ✅ succeeded | 7 npm audit vulnerabilities, several React peer-dep warnings. |
| `npx tsc --noEmit` | ✅ no errors | Strict TypeScript config compiles. |
| `npm test` | ❌ 38 failures / 263 tests, 10 of 36 suites failed | Failures are overwhelmingly caused by the manifest/agent roster drift. |
| `npm run build` (no env) | ❌ failed at static prerender of `/` | `NavbarHome.tsx` instantiates the Supabase client at render time. |
| `npm run build` (with dummy env vars) | ✅ succeeded | All 24 routes generated; only remaining warnings are peer deps and an undici localStorage warning. |
| `npm run lint` | ⚠️ did not run | `next lint` mis-invoked itself; no ESLint config was exercised. |

Full Jest output is available at `/tmp/jest-output.log` from the review environment.

---

## Critical Findings

### C1 — Agent manifest roster drift breaks tests, mocks, Mission Control, and seeded chat data

**Files:** `config/agents.manifest.json`, plus the whole chat/mission-control/test surface.  
**Evidence:**

- The committed manifest now declares five new agents: `architect_agent`, `hermes_agent`, `designer_agent`, `devops_agent`, `ghl_mcp_agent` (`config/agents.manifest.json:7-11`).
- The rest of the code assumes the old five agents: `greeting_agent`, `jarvis_agent`, `calc_agent`, `product_agent`, `ghl_mcp_agent`.
- `src/__tests__/config/manifest.test.ts:118-126` asserts the committed manifest must contain the old agents; it fails.
- `src/app/(cyberize)/mission-control/MissionControlPageContent.tsx:12-17` hardcodes the old agents.
- `src/mocks/data/instructions.ts:14-69`, `src/mocks/data/messages.ts:17-23`, `src/mocks/data/sessionIndex.ts:17-34`, `src/mocks/data/profiles.ts:17-20`, and `src/mocks/responses.ts:39-120` all seed data keyed to the old agents.
- Tests that reference `jarvis_agent`, `greeting_agent`, etc. (`src/__tests__/api/agent-run.test.ts:34`, `src/__tests__/api/agent-history.test.ts`, `src/__tests__/api/instructions-route.test.ts`, `src/__tests__/chat/AgentSwitcher.test.tsx:52`, `src/__tests__/chat/ChatPageContent.test.tsx:77`, `src/__tests__/chat/SessionPanel.test.tsx`, `src/__tests__/chat/chatStore.persist.test.ts:52-53`, `src/__tests__/chat/chatStore.modeSplit.test.ts:70`) fail because `resolveBundleEnvVar` now returns `null` for unknown agents and the default agent is now `architect_agent`.

**Impact:**
- 38 test failures (10 suites).
- `/mission-control` will fetch instructions for unknown agents and receive 400s in live mode or `undefined` in mock mode.
- Mock-mode chat loses all seeded sessions and showcase responses because they are keyed to old agents; new agents only get the generic fallback voice.

**Recommendation:** Either revert the manifest to the old roster or update Mission Control, mocks, seeded data, and tests to the new roster. Do not leave the two in conflict.

---

### C2 — Supabase session refresh middleware is not wired into Next.js

**Files:** `src/utils/supabase/middleware.ts`, `src/proxy.ts` (unused), missing `src/middleware.ts`.  
**Evidence:**

- A correct Supabase SSR setup requires a `src/middleware.ts` (or root `middleware.ts`) that calls `updateSession` on every request.
- The project has only `src/utils/supabase/middleware.ts`, which exports `updateSession`. That utility is never referenced by a real middleware file.
- `src/proxy.ts` exports a `proxy()` function and a `config.matcher` that *looks* like middleware, but it is also not at the required `src/middleware.ts` path, so Next.js ignores it.

**Impact:** Auth session cookies are not automatically refreshed across route transitions. Users can be randomly logged out, especially on long-lived tabs, because the server client reads stale cookies. The comment in `src/utils/supabase/middleware.ts:32-50` explicitly warns about this exact failure mode.

**Recommendation:** Move the middleware logic to `src/middleware.ts` (or have it import `updateSession` from `src/utils/supabase/middleware.ts`) so the matcher covers the app surface.

---

### C3 — Internal agent API routes have no authentication or authorization

**Files:** `src/app/api/agent/run/route.ts`, `src/app/api/agent/history/route.ts`, `src/app/api/agent/instructions/route.ts`.  
**Evidence:**

- `run/route.ts:25` reads `body.user_id` from the request and forwards it to the ADK bundle without verifying that the caller is that user.
- `history/route.ts:22` does the same with `body.user_id` and `body.session_id`.
- `instructions/route.ts:56/75` performs no auth check at all before reading from or writing to the GCS bucket.
- The routes only pass through an `Authorization` header to the upstream (R2 slot). They do not validate the caller's Supabase session.

**Impact:** Any network client that can reach the Next.js frontend can:
- Call `/api/agent/run` and `/api/agent/history` with arbitrary `user_id`/`session_id` combinations, potentially reading other users' sessions if IDs are guessed/leaked.
- Call `PUT /api/agent/instructions` to overwrite agent system prompts without being logged in or having admin rights.

**Recommendation:** Add `createClient()` + `supabase.auth.getUser()` to each route, reject unauthenticated requests, and verify that the request's `user_id` matches the authenticated user. Mission Control writes should additionally require `admin`/`superadmin`.

---

### C4 — Production build fails without env vars because Supabase client is created during render

**Files:** `src/components/global/NavbarHome.tsx:24`, `src/components/global/Navbar.tsx:24`.  
**Evidence:**

- Both navbars call `const supabase = createClient();` directly in the component body. `createClient()` (browser) reads `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` synchronously and throws if they are missing.
- During static prerender (`next build` with no `.env.local`), the home page (`/`) fails with:
  ```
  Error: @supabase/ssr: Your project's URL and API key are required to create a Supabase client!
      at src/components/global/NavbarHome.tsx:24:20
  ```

**Impact:** CI/build environments that do not inject real Supabase keys cannot build the app. Even with keys, instantiating the client on every render is wasteful.

**Recommendation:** Move `createClient()` into `useEffect` / `useMemo` or, better, use the server-side `fetchUserData()` helper for server-rendered shells and pass the user down as props. Avoid creating browser clients during static prerender.

---

## High Findings

### H1 — Auth store persists `isLoading: true`, disabling UI after login or refresh

**File:** `src/store/useAuthStore.ts`.  
**Evidence:**

- Initial state has `isLoading: true` (`line 20`).
- The `login` action sets `user`, `role`, and `isAuthenticated` but never sets `isLoading: false` (`lines 36-40`).
- The `logout` action clears identity fields but also does not set `isLoading: false` (`lines 55-59`).
- The store is wrapped in Zustand `persist`, so the current `isLoading` value is saved to `localStorage` and restored on reload.

**Impact:** After a successful login or page refresh, persisted `isLoading` can remain `true`, causing submit buttons in `LoginForm.tsx:114` and other consumers to stay disabled. This is a genuine runtime bug.

**Recommendation:** Exclude `isLoading` from persistence (`partialize`) and explicitly set it to `false` after login/logout/restore.

---

### H2 — Role values are not validated server-side in user-management flows

**Files:** `src/app/(superadmin)/superadmin-portal/actions.ts:126-162`, `src/app/(superadmin)/superadmin-portal/edit/[id]/EditUserForm.tsx:50`, `src/app/api/auth/superadmin-add-user/route.ts:21-48`.  
**Evidence:**

- `addUser` in `actions.ts:126-162` accepts `formData.role: string` and writes it to `user_metadata` and later `user_roles` without checking it is one of `superadmin|admin|member`.
- `editUser` in `actions.ts:195-198` updates `user_roles.role` with the raw string.
- The `superadmin-add-user` API route does the same (`route.ts:21-48`).
- `EditUserForm.tsx:50` silently maps a `superadmin` user to `admin` in the form default, so opening a superadmin edit page and saving would demote them even if the operator made no change.

**Impact:** A superadmin can create or edit a user with an arbitrary role value (e.g. `"owner"`, `null`, or a typo). Because `user_roles` is updated with `.update(...).eq(...)`, if no row exists for the new user, the update silently affects zero rows and the user is left roleless. `protectPage` will then deny them access.

**Recommendation:** Validate `role` against `AppRole` on the server, and use `upsert` for `user_roles` to guarantee a row exists.

---

### H3 — Superadmin portal `getUsers` excludes superadmins (copied from admin logic) and code is duplicated

**File:** `src/app/(superadmin)/superadmin-portal/actions.ts:20-86`.  
**Evidence:**

- The comment says "paginated list of all users" but the implementation filters `.neq("role", "superadmin")` at `line 32-35`.
- This file is almost identical to `src/app/(admin)/admin-portal/actions.ts`; the only meaningful differences should be role permissions and the ability to add/edit roles.

**Impact:** A superadmin cannot see or manage other superadmins in their own portal. The duplication also means any bug (like this filter) is repeated.

**Recommendation:** Remove the `neq("role", "superadmin")` filter in the superadmin action, or add a dedicated superadmin view. Extract shared user-management queries into a single server module.

---

### H4 — `deleteUser` server actions do not enforce role restrictions

**Files:** `src/app/(admin)/admin-portal/actions.ts:157-168`, `src/app/(superadmin)/superadmin-portal/actions.ts:211-222`.  
**Evidence:**

- The UI in `AdminPortalPageContent.tsx:71-73` hides the delete button for non-members, but the server action `deleteUser` accepts any `userId` and immediately calls `adminClient.auth.admin.deleteUser(userId)`.
- There is no server-side check that the target is a member, or that a superadmin is not deleting themselves.

**Impact:** A malicious or confused admin can delete another admin by calling the action directly. A superadmin can self-delete and lock themselves out.

**Recommendation:** Enforce role-based deletion rules in the server action and add a self-delete guard for the superadmin action.

---

### H5 — Auth routes contain dead code and duplicate route files

**Files:** `src/app/api/auth/login/route.ts:11-27`, `src/app/api/auth/logout/route-1.ts`, `src/app/api/auth/logout/route.ts`.  
**Evidence:**

- `login/route.ts` has a `GET` handler that queries `supabase.from("posts").select("*")` and then returns a generic success message. This is unrelated to login and assumes a `posts` table that may not exist.
- There are two logout route files: `route.ts` and `route-1.ts`. Next.js only uses `route.ts`; `route-1.ts` is dead code that confuses readers.

**Impact:** The GET `/api/auth/login` endpoint is a maintenance hazard and could leak data or cause 500s if the `posts` table is missing. The duplicate logout file is noise.

**Recommendation:** Remove the `GET` handler and `route-1.ts`.

---

## Medium Findings

### M1 — Global `Cache-Control: no-store` disables all caching, including static assets

**File:** `next.config.js:12-33`.  
**Evidence:** The `headers()` function applies `no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0` to every route (`source: "/(.*)"`).

**Impact:** Static assets, the home page, and everything else are uncacheable by CDNs and browsers. Performance and hosting costs suffer for no clear benefit.

**Recommendation:** Apply aggressive no-cache headers only to authenticated pages and API routes; allow Next.js to cache static assets normally.

---

### M2 — Profile forms are duplicated, hardcode role labels, and the `/profile` route is role-restricted incorrectly

**Files:** `src/app/(admin)/profile/ProfileForm.tsx`, `src/app/(members)/members-portal/profile/ProfileForm.tsx`, `src/components/global/Navbar.tsx:115`, `src/components/global/NavbarHome.tsx:119`, `src/app/(admin)/profile/page.tsx`, missing `src/app/(superadmin)/profile/page.tsx`.  
**Evidence:**

- Admin profile form hardcodes `Role: Admin` (`ProfileForm.tsx:67`).
- Member profile form hardcodes `Role: Member` (`ProfileForm.tsx:83`).
- Both navbars link to `/profile`. Only `(admin)/profile/page.tsx` exists; it is gated by the admin layout, so members and superadmins clicking "Profile" are redirected to `/auth`.
- There is no superadmin profile page.

**Impact:** Inconsistent UX and broken profile navigation for members and superadmins.

**Recommendation:** Deduplicate the profile page/form under a single `/profile` route accessible to all authenticated roles, and display the real role from the store/server.

---

### M3 — Auth state persisted to `localStorage` is tamper-prone and redirect logic is unused

**File:** `src/store/useAuthStore.ts`.  
**Evidence:**

- The entire auth state (user, role, `isAuthenticated`) is persisted via Zustand `persist` (`lines 14-65`).
- `login()` returns a redirect path based on role (`lines 43-46`), but `LoginForm.tsx:34-36` ignores the return value and always does `router.push("/chat")`.

**Impact:** Users can edit `localStorage` to change their role, although server-side `protectPage` still enforces the real role. The ignored redirect path is dead code.

**Recommendation:** Do not persist role/client auth state; rely on the server session. Remove the unused redirect return value or use it.

---

### M4 — Server-side Supabase client uses `any`, disables `httpOnly`, and swallows errors

**File:** `src/utils/supabase/server.ts:5-47`.  
**Evidence:**

- `cookieStore` is cast to `as any` (`line 6`).
- Cookie options force `httpOnly: false` with the comment "Supabase needs client access" (`line 25`). Modern `@supabase/ssr` works with `httpOnly: true`.
- `set`/`remove` catch blocks silently swallow exceptions (`lines 28-29`, `40-41`).

**Impact:** Reduced type safety and increased XSS exposure from non-httpOnly auth cookies. Silent failures make cookie issues hard to debug.

**Recommendation:** Use the typed `cookies()` API, set `httpOnly: true` (or let Supabase default), and log cookie errors.

---

### M5 — Chat UI has minor correctness and accessibility issues

**Files:** `src/app/(cyberize)/chat/MessageList.tsx:83`, `src/app/(cyberize)/chat/MessageBubble.tsx:74`, `src/app/(cyberize)/chat/ChatInput.tsx:90-99`, `src/app/(cyberize)/chat/AttachmentMenu.tsx`.  
**Evidence:**

- `MessageList.tsx:83` uses the array index as React `key`.
- `MessageBubble.tsx:74` spreads `{...props}` onto a `<code>` element, passing react-markdown internals (e.g. `node`) to the DOM.
- `ChatInput.tsx:90-99` textarea has no `<label>` (only a placeholder) and relies on the placeholder for context.
- `AttachmentMenu.tsx` is a stub: clicking "Upload file" / "Upload image" only logs to the console.

**Impact:** Index keys can cause rendering glitches on edit/regenerate; unknown DOM props may trigger warnings; the textarea is less accessible; the attachment button promises functionality it does not deliver.

**Recommendation:** Use stable message keys, avoid spreading markdown props, add an accessible label, and either wire attachments or remove the menu.

---

### M6 — Editing the first user message clears the entire thread

**File:** `src/app/(cyberize)/chat/ChatPageContent.tsx:196-204`.  
**Evidence:** Editing message at index `0` calls `truncateAfterIndex(selectedAgent, -1)`, which clears all messages.

**Impact:** Even though there are no messages before the first user message, this behavior is surprising and different from typical "edit from here" semantics. If the implementation ever allows inserting a message, this logic will discard prior context.

**Recommendation:** Document the intended behavior or change it to preserve prior assistant/user turns.

---

### M7 — Dependency tree has peer-dep conflicts and security advisories

**Evidence:** `npm ci` reported:
- React peer-dep conflicts from `react-remove-scroll@2.5.7` and `use-sync-external-store@1.2.0` (pulled in by Radix and Zustand) expecting React 16-18 while the project uses React 19.
- 7 npm audit vulnerabilities (1 low, 5 moderate, 1 high).

**Impact:** Possible runtime incompatibilities and known security issues.

**Recommendation:** Upgrade or override the conflicting peer dependencies and run `npm audit fix` / review the high-severity finding.

---

### M8 — Jest defaults to `testEnvironment: 'node'`; every component test must remember `@jest-environment jsdom`

**File:** `jest.config.js:7`.  
**Evidence:** The default environment is `node`. Every `.tsx` test file has to add `/** @jest-environment jsdom */` at the top. One missing directive would break a component test.

**Impact:** Fragile test setup; easy to regress.

**Recommendation:** Set the default environment to `jsdom` and override only pure server/utility tests to `node`.

---

## Low / Informational Findings

### L1 — Unused / dead code

- `src/app/(superadmin)/superadmin-portal/actions.ts:6` imports `createClient` but only uses `createAdminClient`.
- `src/utils/supabase/fetchUserData.ts` exports `fetchUserData` which is not imported anywhere.
- `src/services/profileService.ts` is no longer used by the chat path (BIM-004 moved authority to the `chat_sessions` index).
- `src/app/api/auth/logout/route-1.ts` is ignored by Next.js.

### L2 — Significant duplication

- `DeleteUserButton.tsx` exists in both `src/app/(admin)/admin-portal/` and `src/app/(superadmin)/superadmin-portal/` with only minor differences (toast vs. `alert`).
- `ProfileForm.tsx` exists in `(admin)/profile/` and `(members)/members-portal/profile/`.
- `src/app/(admin)/admin-portal/actions.ts` and `src/app/(superadmin)/superadmin-portal/actions.ts` share most of `getUsers`/`getUserById`.

### L3 — Mission Control comment is stale

`src/app/(cyberize)/mission-control/MissionControlPageContent.tsx:7-11` says `ghl_mcp_agent` is deliberately omitted, but the real problem is that the entire hardcoded list uses old agent names that no longer exist in the manifest.

### L4 — Feedback and attachments are not implemented

- `src/app/(cyberize)/chat/ChatPageContent.tsx:267-273` `handleFeedback` only logs.
- `src/app/(cyberize)/chat/AttachmentMenu.tsx` upload callbacks are stubs.

### L5 — No input limits on chat or instructions

- `ChatInput.tsx` and `AgentInstructionBlock.tsx` do not enforce maximum length or sanitize content. This could allow accidental abuse of the ADK bundle or GCS writes.

---

## Conclusion

The codebase is structurally sound but currently **not ship-ready** because the agent roster change was not propagated through the rest of the system. Fixing the manifest drift, wiring the Supabase middleware, securing the agent API routes, and repairing the auth-store/build-time client issues would bring it to a much healthier state. After those changes, the remaining medium/low items should be addressed for production hardening.

**Report location:** `contestants/[BLINDED REVIEWER]/REVIEW_REPORT.md`
