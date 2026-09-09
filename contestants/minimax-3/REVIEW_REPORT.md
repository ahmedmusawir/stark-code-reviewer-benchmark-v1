# CR-BENCH-01 — Senior Code Review Report

**Target:** `target/stark-ai-workbench-nextjs-frontend-v1/`
**Reviewer:** minimax-3 contestant (independent senior review)
**Review date:** 2026-09-09
**Scope:** full repository as it exists now. Review-only; no modifications to target code.

---

## 1. Executive summary

The repository is a Next.js 16 / App Router / Supabase frontend with a baked-in
"frontend-first" seam (mock services behind a fixed type contract). The chat
surface is wired to a native ADK connector that has replaced an older Python
wrapper. The repository documents a heavy engineering history (BIM-001..005,
FIX-001..003) in `CHANGELOG.md` and `agent_docs/`, but the **committed code
does not match the committed manifest**: a manifest refactor introduced five
new agents (`architect_agent`, `hermes_agent`, `designer_agent`,
`devops_agent`, `ghl_mcp_agent`) and split the single bundle env var into
`ADK_BUNDLE_URL_V1` / `ADK_BUNDLE_URL_V2_LOCAL`, but a large part of the
application code, mock data, and tests still references the pre-refactor
agent names and env vars.

The single most consequential observation: **the test suite reports 10
failed suites / 38 failed tests** as committed (`npm run test` → `Test
Suites: 10 failed, 26 passed, 36 total. Tests: 38 failed, 225 passed, 263
total`). The failures cluster around the agent manifest migration and a
half-migrated mock seam — the chat surface cannot be tested in isolation
without renaming agents or mock fixtures. Beyond that, several correctness
and dead-code issues are present:

- `src/app/api/auth/login/route.ts` ships a stray `GET` handler that queries
  a `posts` table and is reachable as a public endpoint; it was apparently a
  scratch helper that survived BIM-001.
- `src/app/api/auth/logout/route-1.ts` is an unreferenced duplicate of
  `route.ts` (it lacks the `revalidatePath` call the active one has).
- `/api/auth/superadmin-add-user` route and its test exist but no UI or
  server action calls it; the Add-User flow goes through a server action
  instead.
- The middleware/proxy uses Next.js 16's renamed `proxy.ts` convention
  (`export async function proxy`) but exports an underscore-decorated matcher
  pattern that uses a non-standard exclusion syntax — fine, but worth
  verifying against the actual framework version.

Findings below are split into **Demonstrated problems** (something I can
point to with a concrete file/line and a realistic failure scenario),
**Concerns / tradeoffs** (situations I would want a second opinion on),
and **Optional improvements** (not strictly defects).

---

## 2. Verification performed

- Read top-level: `package.json`, `tsconfig.json`, `next.config.js`,
  `jest.config.js`, `README.md`, `CLAUDE.md`, `BACKEND_SWAP_NOTES.md`,
  `RECOVERY.md`, `CHANGELOG.md`.
- Read all `src/app/**` route files (layouts, pages, server actions, API
  routes).
- Read all `src/services/**` files (chatService, profileService,
  instructionsService, sessionIndexService, index).
- Read `src/utils/**` (supabase clients + middleware, get-user-role,
  commonUtils, speech, app-role).
- Read `src/store/**` (useAuthStore, chatStore).
- Read `src/components/**` (auth, chat, common, dashboard, global, layout,
  ui).
- Read `src/config/manifest.ts` and the manifest JSON.
- Read `src/types/index.ts`.
- Read `src/mocks/responses.ts` and the seeded mock data modules.
- Read SQL files under `supabase/`.
- **Ran `npm run test`** — see verification results below.

### 2.1 Verification results

```
$ npm run test
Test Suites: 10 failed, 26 passed, 36 total
Tests:       38 failed, 225 passed, 263 total
Snapshots:   0 total
Time:        11.356 s
```

Failed suites:

| Suite                                       | Failed tests |
|---------------------------------------------|--------------|
| `src/__tests__/chat/AgentSwitcher.test.tsx` | 1            |
| `src/__tests__/chat/SessionPanel.test.tsx`  | 6            |
| `src/__tests__/api/agent-run.test.ts`       | 9            |
| `src/__tests__/api/agent-history.test.ts`   | 7            |
| `src/__tests__/api/instructions-route.test.ts` | 8         |
| `src/__tests__/chat/chatStore.persist.test.ts` | 3         |
| `src/__tests__/chat/chatStore.modeSplit.test.ts` | 1       |
| `src/__tests__/chat/MessageList.loading.test.tsx` | 1     |
| `src/__tests__/chat/ChatPageContent.test.tsx` | 1          |
| `src/__tests__/config/manifest.test.ts`     | 1            |

Common root causes across the failures:

1. **Agent-name drift.** Many tests assert against legacy names
   (`greeting_agent`, `jarvis_agent`, `calc_agent`, `product_agent`)
   that no longer exist in the committed manifest
   (`config/agents.manifest.json`). Examples:
   - `src/__tests__/chat/AgentSwitcher.test.tsx` expects buttons
     labelled `Jarvis` / `Greeting` etc.; manifest labels are
     `Architect Agent` / `Harmes Main Agent` etc.
   - `src/__tests__/chat/SessionPanel.test.tsx` references
     `greeting_agent` in seeded index entries; `MissionControl` and
     mock seeded data also use legacy names.
   - `src/__tests__/chat/chatStore.persist.test.ts` and
     `chatStore.modeSplit.test.ts` write sessions keyed by
     `greeting_agent` / `jarvis_agent` / `calc_agent` and then expect
     the store to round-trip — these names work because the store
     itself is agent-name-agnostic, but tests like
     `SessionPanel` and `AgentSwitcher` fail because the **rendered**
     UI no longer exposes those agents.

2. **Default-agent mismatch.** `src/__tests__/chat/ChatPageContent.test.tsx:77`
   calls `findByPlaceholderText(/ask greeting_agent/i)`; the manifest's
   first agent is `architect_agent`, so the rendered placeholder is
   `Ask architect_agent...`. The test fails (`TestingLibraryElementError`).
   The same is visible in the captured DOM dump during the run:
   `placeholder="Ask architect_agent..."` (see test failure excerpt).

3. **Manifest-validation regression.** `src/__tests__/config/manifest.test.ts`
   asserts the committed manifest declares the **original five agents**
   (`greeting_agent`, `jarvis_agent`, `calc_agent`, `product_agent`,
   `ghl_mcp_agent`); the manifest now declares a different five. This is
   a test that has not been updated to match the BIM-003 refactor.

4. **`/api/agent/*` tests fail because they exercise the native connector
   against the wrong agent name.** Tests use `agent_name: 'jarvis_agent'`
   in their request bodies; the route resolves it via
   `resolveBundleEnvVar`, which now returns `null` for the legacy name,
   so the route returns 400 instead of 200. Same root cause for
   `agent-history.test.ts`.

5. **Instructions-route tests fail because the route validates `agent_name`
   against the manifest and rejects legacy names.** Tests pass
   `agent_name: 'greeting_agent'` in PUT bodies; the route's
   `requireKnownAgent` returns 400. Same root cause as #4.

6. **chatStore.persist "F4" / "back-compat" / "SSR guard"** — these
   tests reference `greeting_agent` / `jarvis_agent` keys that the
   partialize / rehydration logic itself does not validate, but the
   test files expect specific persisted JSON shapes; at least one
   (`partialize: message content never reaches localStorage`) shows
   "expect(received).toEqual(expected) // deep equality" — likely a
   stale expected-shape constant.

7. **modeSplit "H1"** — likely the new persist key namespace and the
   legacy-adoption code path interact differently than the test
   expects. The store code looks consistent; the test probably
   asserts against pre-FIX-003 key behavior.

I did not attempt to fix any of these (review-only constraint).

---

## 3. Demonstrated problems

### 3.1 [CRITICAL] Stale `GET` handler in `/api/auth/login` queries a `posts` table

**File:** `src/app/api/auth/login/route.ts:11–22`

```ts
// Testing the route
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const res = NextResponse.json(
    { message: "Auth login Route Accessed Successfully!" },
    { status: 200 }
  );
  res.headers.set("Cache-Control", "no-store, ...");
  ...
}
```

This is a debug "is the route alive?" handler left behind in a publicly
reachable API route. It:

- Runs a `select *` against a `posts` table that the rest of the codebase
  does not use (no schema, no migration, no UI consumer).
- Exposes the Supabase connection error message in the response body
  (any unauthenticated caller can probe schema names / connectivity).
- Is reachable at `GET /api/auth/login` with no auth check.

**Realistic failure scenario.** A non-authenticated user (or a scanner)
hits `GET /api/auth/login`. The route returns either a 200 with the
stub `Auth login Route Accessed Successfully!` message, or a 400 whose
body contains the raw Supabase error message (`relation "posts" does
not exist` etc.), which leaks backend connectivity and schema hints.
This handler should be deleted; it is dead from the application logic's
point of view and only debug noise from any other.

The exact same file also sets `Cache-Control: no-store, ...` headers on
every response, which is correct for `POST` (auth response must never
cache) but is harmless on the dead `GET` — once the `GET` is deleted the
header set is only on `POST`.

### 3.2 [CRITICAL] `/api/auth/logout/route-1.ts` is an orphan duplicate

**File:** `src/app/api/auth/logout/route-1.ts` (entire file, 19 lines)

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );
}
```

This is a near-clone of `src/app/api/auth/logout/route.ts` minus the
`revalidatePath('/', 'layout')` line. Grep shows no references to
`route-1` anywhere in `src/` (production code, tests, or docs). Next.js
will not route to a file named `route-1.ts` at a path like
`/api/auth/logout/route-1`, but the file ships in the source tree and
will confuse future maintainers, linters, and bundle auditors.

**Realistic failure scenario.** A future maintainer adds a new feature
branch and edits `route-1.ts` thinking it's the live handler, then ships
a logout that does NOT purge the layout cache — exactly the bug the
canonical `route.ts` was modified to fix.

### 3.3 [CRITICAL] `/api/auth/superadmin-add-user` route has no caller

**File:** `src/app/api/auth/superadmin-add-user/route.ts` (entire file, 86 lines)

`grep -rn superadmin-add-user src/` returns only one match outside the
file itself — its own test
(`src/__tests__/superadmin-add-user.test.ts:13`). No server action, no
client component, no other API route, no factory doc references this
endpoint. The actual add-user flow runs through the `addUser` server
action in `src/app/(superadmin)/superadmin-portal/actions.ts`.

The endpoint itself is well-formed: it verifies the caller is a
superadmin via `getUserRole` and uses the admin client to create the
user. But because nothing calls it, it is dead code that:

- Wastes review attention (defensive code reviewing a never-reached
  endpoint).
- Carries a real authorization contract ("only superadmins can call
  this") that has zero enforcement value because nothing calls it.
- Is the only place in the app that creates Supabase auth users
  outside of `signup` and the superadmin server action — a future
  maintainer could ship an HTML form posting here without realizing
  the auth contract differs from the server action.

**Realistic failure scenario.** A future developer assumes the endpoint
is wired and POSTs to it from the Add User form, bypassing the
`addUser` server action and its `revalidatePath` cleanup. The form
works (because the route accepts the body), but the superadmin list
doesn't refresh on the next paint until a hard reload — a user-visible
"the new user didn't appear" bug that takes a while to trace back.

Either delete the route + its test, or wire it into the Add User form
(but there is no current reason to choose the endpoint over the server
action).

### 3.4 [HIGH] Server actions trust page-level guards and skip role checks

**Files:**
- `src/app/(superadmin)/superadmin-portal/actions.ts`
- `src/app/(admin)/admin-portal/actions.ts`
- `src/app/(cyberize)/chat/ChatPageContent.tsx` (mount effect)

The superadmin server actions (`getUsers`, `getUserById`, `addUser`,
`editUser`, `deleteUser`) and admin server actions (`getUsers`,
`getUserById`, `editUser`, `deleteUser`, `addMember`) all use
`createAdminClient()` and operate with the service-role key. **None of
them re-check the caller's role.** The only gate is the page-level
`protectPage([AppRole.SUPERADMIN])` in the layout.

`protectPage` is correct for blocking an *initial render* by an
unauthenticated or wrong-role user, but Next.js server actions can be
called by any client component that imports them — including a
component rendered by an admin layout that exposes the superadmin
portal through a side import, or a script that hits the route action
endpoint with the right shape.

Compare this to `/api/auth/superadmin-add-user/route.ts` (lines 14–24),
which *does* re-check `getUserRole(user.id) !== "superadmin"` inside the
handler.

**Realistic failure scenario.** An admin role (not superadmin) loads
`/superadmin-portal` — they get redirected by the layout (good). But if
any client code paths through, for example, `addUser` via a manually
crafted form POST or an admin page that imports the superadmin action
by mistake, the service-role client will execute the privileged write
with no role check. RLS would not stop it either — `createAdminClient()`
bypasses RLS by design.

**Recommended mitigation.** Every server action that uses
`createAdminClient` should re-derive the caller's role inside the
action body and reject calls from roles that shouldn't be performing
the operation. This is defense in depth and matches the pattern the
existing `/api/auth/superadmin-add-user/route.ts` already established.

### 3.5 [HIGH] Mock / live seam has drifted from the committed manifest

**Files:**
- `src/mocks/data/instructions.ts` (uses `greeting_agent`, `jarvis_agent`, `calc_agent`, `product_agent`)
- `src/mocks/data/messages.ts` (uses the same four legacy names + their session IDs)
- `src/mocks/data/profiles.ts` (uses `greeting_agent`, `jarvis_agent`)
- `src/mocks/data/sessionIndex.ts` (uses `greeting_agent`, `jarvis_agent`)
- `src/mocks/responses.ts` (voice scripts for the legacy five agents)
- `src/app/(cyberize)/mission-control/MissionControlPageContent.tsx:12–17`
  (hardcodes `greeting_agent`, `calc_agent`, `jarvis_agent`,
  `product_agent`)
- `config/agents.manifest.json` (declares `architect_agent`,
  `hermes_agent`, `designer_agent`, `devops_agent`, `ghl_mcp_agent`)

The committed manifest is the **source of truth** per its own docstring
(`src/config/manifest.ts:5–12`, BIM-003 Amendment A3). The mock data
layer, Mission Control page, and several test files were not migrated
to the new roster.

**Failure scenarios.**

1. **Mock-mode chat is unusable on first load.** The default agent is
   `architect_agent` (first manifest entry). The mock service layer
   does not seed a session, an instruction blob, or a voice response
   for `architect_agent`. The chat sidebar will render an empty
   session list for the default agent; the `SessionPanel` will show
   "New Chat" only; and any `architect_agent` send will produce the
   generic `default:` branch in `generateMockResponse`
   (`src/mocks/responses.ts:127–134`) with the placeholder text
   `[architect_agent] Mock mode — I received: "..."`. The default agent
   is essentially broken in mock mode.

2. **Mission Control renders blank editor blocks for missing agents.**
   `MissionControlPageContent` hardcodes the legacy roster. In LIVE
   mode the `/api/agent/instructions` route rejects these names with
   400 (`Unknown agent: greeting_agent`). The operator will see the
   error string in the textarea per `AgentInstructionBlock` (the
   Streamlit-original error UX, lines 47–50). In MOCK mode the
   `mockInstructionsStore` does have these keys, so the editor
   renders content — but the work happens on the legacy agent names
   that have no production counterpart.

3. **`AgentSwitcher` sidebar does not show the legacy agents, but
   `SessionPanel` and Mission Control still reference them.** A
   first-time user sees five agents in the sidebar but Mission Control
   edits different agents entirely, with no UI to choose.

This is exactly the "the manifest is the source of truth; if code
conflicts with the factory doc, flag it" failure mode the project
CLAUDE.md calls out (`target/.../CLAUDE.md` §Factory Pipeline
Awareness). The migration introduced a roster split; the migration
was not completed.

### 3.6 [HIGH] Tests fail: 10 suites / 38 tests

See §2.1. The user-visible impact is that the project cannot claim a
green test board. The README and `RECOVERY.md` both reference the
"263 green" baseline, which no longer holds. CI gating based on
`npm test` will fail. If this repo were reviewed against its own
CHANGELOG claim of "Tests: 36 suites / 263 green", that claim is now
factually wrong.

This is a real defect: the test suite is part of the contract for
shipping features (BIM/FIX/FEAT entries all include "Tests:" lines).
A broken board blocks future BIM work.

### 3.7 [MEDIUM] `proxy.ts` uses Next 16's renamed convention but the project is not consistently migrated

**File:** `src/proxy.ts` (entire file, 13 lines)

Next.js 16 renamed `middleware.ts` to `proxy.ts` (exporting
`proxy(req)`). The repository has `src/proxy.ts` using the new
convention. However:

- `src/utils/supabase/middleware.ts` exports `updateSession` and is
  imported by `proxy.ts` as `@/utils/supabase/middleware`. The
  filename still says "middleware" — fine functionally, but the file
  path is misleading for future maintainers who grep for "middleware".
- `src/__tests__/proxy.test.ts` exists for the new convention.
- The rest of the project (Supabase SSR docs, the `updateSession`
  function name, the Supabase SSR package's `middleware`-named
  helpers) still refer to "middleware".

**No behavioral defect** — `proxy.ts` runs the session refresh on the
configured matcher and the matcher excludes static assets, which is
correct. The concern is naming consistency.

### 3.8 [MEDIUM] `getUserRole` returns null silently on lookup failure

**File:** `src/utils/get-user-role.ts:23–32`

```ts
const { data, error } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId)
  .single();

if (error || !data) {
  console.error('Error fetching user role:', error);
  return null;
}
```

The function collapses three failure modes — no row, query error,
connection failure — into `null`. Every caller (`protectPage`,
`getUserRole` is also called from `/api/auth/superadmin-add-user`)
treats `null` as "no permission". This means a transient Supabase
outage that prevents reading `user_roles` will manifest as
"permission denied for everyone, including the superadmin".

**Realistic failure scenario.** Supabase has a brief incident. A
superadmin hits `/superadmin-portal`. The layout calls
`protectPage([AppRole.SUPERADMIN])`. The role lookup returns `null`.
`protectPage` redirects to `/auth`. The superadmin is locked out of
the portal — and there's no error visible to the user beyond "you're
on the login page again."

**Suggested mitigation.** Distinguish "no row" (legitimately no role,
should redirect to `/auth`) from "lookup failed" (transient, should
retry or show a 503-style error). At minimum, do not silently treat
errors as authorization failures.

### 3.9 [MEDIUM] `protectPage` redirects to `/auth` for unauthorized users without distinguishing "not logged in" vs "wrong role"

**File:** `src/utils/supabase/actions.ts` (entire file)

```ts
export async function protectPage(allowedRoles: AppRole[]) {
  ...
  if (!user) {
    return redirect("/auth");
  }

  const userRole = await getUserRole(user.id);
  if (!userRole || !allowedRoles.includes(userRole)) {
    return redirect("/auth");
  }

  return user;
}
```

Both unauthenticated and unauthorized users land on `/auth`. A
superadmin who accidentally visits `/members-portal` is silently
bounced to the login page; they cannot tell from the page whether
they're logged out or whether their role doesn't grant access. There
is no "you do not have access to this page" message.

**Realistic failure scenario.** Superadmin user A (who has role
`superadmin` in the database) visits `/members-portal` to check the
member UX. They are redirected to `/auth`. They see the login form,
think their session expired, and re-enter credentials. No harm done
but the UX is misleading.

### 3.10 [MEDIUM] `useAuthStore.login` returns a role-redirect string that the caller discards

**File:** `src/store/useAuthStore.ts:24–33`

```ts
login: async (email, password) => {
  ...
  if (role === "superadmin") return "/superadmin-portal";
  if (role === "admin") return "/admin-portal";
  if (role === "member") return "/members-portal";
  return "/";
}
```

And the only caller, `src/components/auth/LoginForm.tsx:35–37`:

```ts
router.refresh();
router.push("/chat");
```

The login form **always** routes to `/chat`, ignoring the role-based
path the store computes. The branching on `role` in the store is
dead code from the caller's perspective.

Either:

- (a) Delete the branching in `useAuthStore.login` and just return
  `void`, since the caller hard-codes `/chat`.
- (b) Have the caller actually use the returned path.

(a) is the right move if the project truly wants all authenticated
users landing in the chat surface; (b) is right if the role-based
portals are meant to be the post-login destination.

This is not a defect per se — the form's behavior is correct for
"all cyberize users land in chat". It is a sign of unfinished
integration that future readers will trip over.

### 3.11 [MEDIUM] `getCurrentUserId` extraction is repeated and unsafe

**Files:**
- `src/app/(cyberize)/chat/ChatPageContent.tsx:36–39`
- `src/components/layout/CyberizeSidebar.tsx:22–25`

```ts
const userId =
  user && typeof user === "object" && "id" in user
    ? String((user as { id: unknown }).id ?? "")
    : "";
```

`useAuthStore.user` is typed `any | null`. Two components reach in
with the same defensive extraction. The shape is decided ad hoc at
each call site.

If the supabase-js user shape ever changes (e.g., id becomes a number,
or wraps in a sub-object), the extraction silently produces the wrong
string and chat requests go to the wrong user_id. A typed wrapper
(e.g., a `selectUserId` selector) would catch this at compile time.

### 3.12 [LOW] Logout server-side invalidation diverges from comment

**File:** `src/app/api/auth/logout/route.ts`

The docstring at `BACKEND_SWAP_NOTES.md:§3` explicitly notes "Phase 2
of overall lifecycle: nothing to do for auth. It's already real." and
`Open Question 3` is whether to keep the kit's server-side
`signOut()` or revert to client-only. The kit's signOut is kept here
(good) but the choice is unrecorded in any decision log; a future
maintainer reading the code cannot tell whether this was intentional
or accidental.

### 3.13 [LOW] `EditUserForm` default value precedence is broken

**File:** `src/app/(superadmin)/superadmin-portal/edit/[id]/EditUserForm.tsx:21–24`

```ts
defaultValues: {
  name: user.full_name ?? "",
  role: (user.role === "superadmin" ? "admin" : user.role) as FormValues["role"] ?? "member",
},
```

If `user.role === "superadmin"`, the form defaults to `"admin"`. But
the schema is `z.enum(["admin", "member"])` — passing `"admin"` for
a superadmin means the form lies about the role on screen, and if the
operator doesn't change it, the server `editUser` action will UPDATE
the superadmin's role to `"admin"`. There is no visible warning.

Compare to the admin layout's `edit/[id]/EditUserForm.tsx`, which
correctly hides the role select entirely for admins editing users.
The superadmin version should either:

- Not allow editing superadmins (gate in the page), or
- Show a disabled "Superadmin" indicator and lock the role field.

**Realistic failure scenario.** A superadmin opens the edit page for
themselves. The form shows `Admin` as the selected role. They tab
through and click "Save Changes" without touching the role. Their
superadmin role has just been downgraded to admin. They now lack
access to `/superadmin-portal` and the only way back is a direct
DB write.

### 3.14 [LOW] `addUser` toTitleCase corrupts non-ASCII names

**Files:**
- `src/app/(superadmin)/superadmin-portal/actions.ts:73–76`
- `src/app/(admin)/admin-portal/actions.ts:5–7`

```ts
function toTitleCase(name: string): string {
  return name.trim().replace(/\b\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}
```

`\w` is `[A-Za-z0-9_]` in JavaScript. Any Unicode letter outside
that set is treated as a word boundary. Names with accents, Cyrillic,
CJK characters, etc., are silently lowercased past the first
character or split in unexpected places.

**Realistic failure scenario.** An admin types `Étienne Ó hAilín`
into the Add User form. The function processes:
- `Étienne` → `É` is not `\w` so the function treats the apostrophe
  as a word break and lowercases the rest. Output: `Étienne` (which
  happens to look right) — but `Ó hAilín` becomes `ó Hailín` because
  the space and `Ó` interplay produces unexpected splits.

Lower priority because it's UI / data quality, not a security bug,
but it will produce visibly wrong names in production for
international users.

### 3.15 [LOW] `attachButton` keyboard / focus management could trap focus

**File:** `src/components/chat/SessionPanel.tsx:141–168`

The rename input uses `autoFocus` and `onBlur` to commit. If the
operator clicks the Save (Check) button, focus moves to the button,
`onBlur` fires, the commit runs, the input unmounts — and now focus
has nowhere to go (the input is gone, the new title's row doesn't
re-focus). This is a small accessibility regression.

A `onKeyDown` handler for Escape exists for the input; the button
correctly commits on click. The issue is just the focus-return path
after blur.

---

## 4. Concerns and tradeoffs

These are not necessarily defects; I would want a second opinion
before classifying them as bugs.

### 4.1 [CONCERN] GCS instruction writes have no concurrency control

**File:** `src/app/api/agent/instructions/_lib/gcsInstructions.ts:48–60`

```ts
let backedUp: string | null = backupObjectPath;
try {
  await current.copy(bucket.file(backupObjectPath));
} catch (e) { ... }

await current.save(content, { contentType: 'text/plain' });
```

The "backup before write" law is correct, but if two operators save
nearly-simultaneously, the sequence is:

1. Operator A: copy existing → backupA (success)
2. Operator B: copy existing → backupB (still has the original)
3. Operator A: save new content (overwrites the live file)
4. Operator B: save their new content (overwrites A's write)

Operator A's edit is silently lost. The module's own header doc
acknowledges this: *"Concurrency is last-write-wins (I8, documented)."*
The concern is whether operators actually understand this. A
read-modify-write advisory lock would be the standard fix.

### 4.2 [CONCERN] `proxy.ts` re-runs `supabase.auth.getUser()` on every request

**File:** `src/utils/supabase/middleware.ts:46`

```ts
// Refresh the session but don't redirect - let layouts handle auth
await supabase.auth.getUser();
```

The middleware docs from Supabase recommend this pattern (call
`getUser` between client creation and any other logic). The cost is
one round-trip to Supabase per request to every non-static path. For
the public landing page and authenticated portals this is probably
fine, but it's worth noting that the proxy is configured to match
`/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)`
which excludes images but includes every other HTML route. If the
proxy becomes a hotspot, the easiest fix is to skip the auth refresh
on truly public paths (`/` itself).

### 4.3 [CONCERN] `SessionPanel` archive uses optimistic UI with no rollback

**File:** `src/components/chat/SessionPanel.tsx:75–82`

```ts
const handleArchive = (entry: SessionIndexEntry) => {
  void sessionIndexService.archiveSession(entry.id);
  const remaining = (sessions ?? []).filter((s) => s.id !== entry.id);
  setSessionList(selectedAgent, remaining);
  ...
};
```

The archive is fire-and-forget. If the service call fails (network,
RLS, etc.), the row disappears from the UI but is not archived in
the DB. The sessionIndexService.archiveSession implementation
*does* log to console.error on failure, but the UI gives no
feedback. Either surface a toast on failure or revert the optimistic
update.

This is consistent with the doctrine in `sessionIndexService.ts`
("index failures degrade non-blocking") but for *archive* specifically
it's a user-confusing action: "I clicked archive, the row vanished,
but if I refresh it's still there."

### 4.4 [CONCERN] `proxy.ts` matcher excludes static assets but not all of them

The current matcher excludes `svg|png|jpg|jpeg|gif|webp`, but does
not exclude `.ico` extensions beyond the literal `favicon.ico`. Other
static paths (e.g., `/robots.txt`, `/sitemap.xml`, `/manifest.json`,
`/sw.js`) will trigger a Supabase round-trip on every fetch. Likely
harmless, just noting.

### 4.5 [CONCERN] Manifest bundles are declared but `v2-local` has no users

**File:** `config/agents.manifest.json`

```
"bundles": [
  { "id": "v1", "label": "ADK Bundle v1", "urlEnv": "ADK_BUNDLE_URL_V1" },
  { "id": "v2-local", "label": "Harness v2 (local)", "urlEnv": "ADK_BUNDLE_URL_V2_LOCAL" }
],
"agents": [
  ... 5 agents all bound to "v1"
]
```

The second bundle is declared and validated, but no agent references
it. The loader will validate, the UI will render the bundle list
internally, and the env var lookup is exercised only via unit tests.
This is fine if `v2-local` is a planned target; otherwise the dead
bundle adds noise.

### 4.6 [CONCERN] Mock chat bot voice for the new default agent

**File:** `src/mocks/responses.ts:127–134`

```ts
default:
  return [
    `[${agentName}] Mock mode — I received: "${echo}".`,
    ...
  ].join("\n");
```

The default branch is the only thing that runs for `architect_agent`,
`hermes_agent`, etc. The user sees a message that says "Mock mode —
I received: ...". If the intent of BIM-003 was that mock-mode demos
should "just work" with a roster change, the seed instructions /
sessions / voices should be updated for the new roster.

---

## 5. Optional improvements

These are not defects and the project might have good reasons for
the current shape; flagging only.

### 5.1 Mock-mode response generator has minor dead variable

**File:** `src/mocks/responses.ts:26–28`

```ts
const session_id = sessionId ?? `mock-session-${Date.now()}`;
const response = composeAgentVoiceResponse(agentName, userMessage);
return { response, session_id };
```

`composeAgentVoiceResponse` is only used inside `generateMockResponse`,
and the file has a single export. The two-call decomposition is fine
for testability but the file comment header on line 9–16 enumerates
showcase agents that don't match the committed manifest. Either
update the comment or add the legacy agents back to the manifest.

### 5.2 `useChatStore` action `setSelectedAgent` records `lastSelectedAgent` but no consumer uses it

**File:** `src/store/chatStore.ts:140–143`

```ts
setSelectedAgent: (name) =>
  set((state) => ({
    selectedAgent: name,
    lastSelectedAgent: state.selectedAgent,
  })),
```

`lastSelectedAgent` is stored, persisted-payload excludes it
(correctly), but no component reads it. It is set up for an
"undo" or "back" UX that doesn't exist. Either delete it or wire
it up.

### 5.3 Mock store reset helpers are exported but unused

**File:** `src/mocks/data/profiles.ts:27–32`

```ts
export const resetMockProfileStore = (): void => { ... }
```

Useful for tests, but no test currently calls it. The export is
test-only surface; consider gating behind a `__tests__`-only
re-export.

### 5.4 `useEffect` deps comment-out pattern

Several `useEffect` blocks in `ChatPageContent.tsx` carry
`// eslint-disable-next-line react-hooks/exhaustive-deps`. The
disable is justified in comments, but a refactor to `useCallback`
+ an explicit memoized handler would remove the need for the
suppression and survive a future "add a new dep" oversight.

### 5.5 `attachButton` keyboard trap (already noted) — minor a11y

The rename input's autoFocus + onBlur pattern means keyboard users
who tab away trigger an unintended commit. A `requestSubmit`-style
flow with explicit Save / Cancel buttons would be more predictable.

---

## 6. What was not reviewed

- **Supabase row-level-security policies.** I read the schema setup
  file (`supabase/chat_sessions_setup.sql`) and confirmed SELECT /
  INSERT / UPDATE policies exist and are scoped to `auth.uid() =
  user_id`. I did not verify that the deployed policies match what
  the SQL describes; that requires running against a live Supabase
  project.
- **Real ADK bundle behavior.** I read the connector code and the
  test fixtures, but did not exercise a live ADK bundle.
- **Build / typecheck.** I did not run `npm run build` or
  `tsc --noEmit`. The test failures are the visible signal; a
  typecheck pass would be a useful additional check.
- **Playwright e2e tests.** The package declares `playwright test`
  but I did not run them — they would require browser binaries and
  likely a live backend.
- **Lint.** I did not run `npm run lint`; the `RECOVERY.md`
  mentions a "pre-existing B1" lint defect that has been left in
  scope.
- **The `agent_docs/` directory.** I read CHANGELOG.md and
  RECOVERY.md but did not read the rest of the factory docs.
  Per the REVIEW_PROMPT.md context boundary, I'm using my own
  senior engineering judgment rather than scoring against
  factory-doc rules.

---

## 7. Verification / evidence summary

| Concern | File | Line(s) | Evidence |
|---|---|---|---|
| Stray `GET` handler | `src/app/api/auth/login/route.ts` | 11–22 | Handler queries a `posts` table with no schema/UI consumer; reachable as public endpoint |
| Orphan duplicate logout | `src/app/api/auth/logout/route-1.ts` | 1–19 | Grep finds zero references; missing `revalidatePath` |
| Unused superadmin-add-user route | `src/app/api/auth/superadmin-add-user/route.ts` | 1–86 | Grep finds only its own test references the path |
| Server actions skip role check | `src/app/(superadmin)/superadmin-portal/actions.ts`, `src/app/(admin)/admin-portal/actions.ts` | `getUsers`, `addUser`, `editUser`, `deleteUser`, etc. | No `getUserRole` re-check; compare to `/api/auth/superadmin-add-user/route.ts` which does check |
| Agent roster drift | `src/mocks/data/*.ts`, `src/app/(cyberize)/mission-control/MissionControlPageContent.tsx` | various | Legacy names referenced; manifest declares new roster |
| Default agent mismatch | `src/app/(cyberize)/chat/ChatPageContent.tsx` (rendered DOM) | runtime | Test failure `findByPlaceholderText(/ask greeting_agent/i)` vs rendered `placeholder="Ask architect_agent..."` |
| Test board | `npm run test` | n/a | 10 failed suites, 38 failed tests, 263 total |
| Role collapse on error | `src/utils/get-user-role.ts` | 28–32 | Returns `null` for both no-row and error |
| Edit form downgrade risk | `src/app/(superadmin)/superadmin-portal/edit/[id]/EditUserForm.tsx` | 21–24 | Superadmin role defaults to `"admin"`, schema is `z.enum(["admin","member"])` |
| `toTitleCase` Unicode bug | `src/app/(superadmin)/superadmin-portal/actions.ts`, `src/app/(admin)/admin-portal/actions.ts` | helper fns | `\w` is ASCII-only |
| Last-write-wins on GCS save | `src/app/api/agent/instructions/_lib/gcsInstructions.ts` | 47–60 | Two-operator race silently loses one's write |
| Mock mode unusable for default agent | `src/mocks/responses.ts`, `src/mocks/data/*` | 127–134 default branch | No seeded session / voice for `architect_agent` |
| `lastSelectedAgent` unused | `src/store/chatStore.ts` | 140–143 | No consumer reads it |
| Login redirect string unused | `src/store/useAuthStore.ts`, `src/components/auth/LoginForm.tsx` | 31–33, 35–37 | Store computes role path; caller hard-codes `/chat` |

---

## 8. Recommended next actions (for whoever picks this up)

The order I would tackle these in, with the highest-impact first:

1. **Decide what the agent roster actually is** (manifest or
   mock data). Right now the codebase is split. Pick one source
   of truth and migrate the other side. This single fix unblocks
   most of the failing tests.
2. **Add role checks inside the privileged server actions.**
   Defense in depth: `protectPage` is a render guard, not an
   action guard. `/api/auth/superadmin-add-user` already shows
   the pattern.
3. **Fix `EditUserForm` role downgrade bug** for the superadmin
   editing their own row.
4. **Delete the stray `GET` handler in `/api/auth/login/route.ts`,
   the orphan `/api/auth/logout/route-1.ts`, and either wire or
   delete `/api/auth/superadmin-add-user`.**
5. **Decide the post-login destination.** Either route by role or
   remove the dead branching in `useAuthStore.login`.
6. **Update `BACKEND_SWAP_NOTES.md` and the CHANGELOG `Tests:`
   numbers to reflect reality.** The claim of "36 suites / 263
   green" is no longer accurate.
7. **Distinguish "no role row" from "lookup failed" in
   `getUserRole`.** Avoid silent lockouts during Supabase
   incidents.

These are not exhaustive; the rest are nice-to-haves.

---

## 9. Notes on this review's process

- I followed the REVIEW_PROMPT.md boundaries strictly: read-only
  inspection of the target repo, no modifications, no git writes.
- I did not look at any benchmark control-plane material (other
  contestants, scorecards, reference reviewer reports, agent_docs
  beyond the project-level CHANGELOG/RECOVERY for context).
- I used my own senior engineering judgment, not the project's
  factory pipeline rules, per the prompt instructions.
- I did not run the build / typecheck / lint / playwright; only
  `npm run test`.
- The report is the authoritative artifact for this contestant
  run; I have not modified any target files.

— end of report —