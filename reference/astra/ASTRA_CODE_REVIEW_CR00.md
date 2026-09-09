# Independent Code Review — CR00

Review date: 2026-09-08  
Repository: `stark-ai-workbench-nextjs-frontend-v1`  
Reviewed HEAD: `466083f2b415d9faeb362eb5e48f6e259a42d840`  
Review type: repository-wide, review only

## Assessment

The application builds successfully, but I would not approve an externally accessible deployment with live credentials in its current state. Privileged server actions lack caller authorization, the instructions API exposes service-account-backed reads and writes without authentication, and the chat APIs trust caller-supplied user identities. These are independent of the page-level access checks.

There are also reproducible functional problems: Mission Control's entire agent list disagrees with the current manifest; chat requests can write results into a different active conversation; one logout path retains another account's chat state; and the supplied database setup does not implement the user-creation behavior assumed by the portal.

The production build and type checks pass. The existing Jest suite fails: **37 failed / 226 passed tests across 10 failed / 26 passed suites**. Thirteen additional, temporary reproduction checks passed by asserting the problematic behavior described below. These passing probes demonstrate defects; they are not passing acceptance tests for a corrected implementation.

## Scope, method, and boundaries

Reviewed the App Router layouts and API handlers, Supabase clients and server actions, database setup and RLS policies, agent routing and ADK normalization, GCS instruction persistence, chat/session services and Zustand stores, login/logout flows, principal chat and administration UI, rendering and accessibility details, package/configuration files, and existing tests. Inspected the short git history and generated production server-action registration metadata where useful.

Engineering judgments here are independent of Factory/process conventions. Comments describing intentional behavior were treated as context, not as exemptions from correctness or security analysis. No application code, existing tests, configuration, database, or git history/index/branch state was changed. The requested report is the only repository addition.

The workspace initially denied sandbox access. Approved commands outside the sandbox resolved source access. Dependencies were absent, so installation, builds, test caches, and reproduction files were confined to a temporary copy:

`C:\Users\user\AppData\Local\Temp\astra-cr00-0716a24be9954e0e81a64de24c9d7686`

The copy contains `src`, `config`, `public`, and the package/build/test configuration. A final SHA-256 comparison verified **182 source/config files with zero differences** between the repository and test copy. The build preceded creation of the temporary reproduction tests. Git status and diff were clean before this report was written.

Severity describes impact under the stated conditions: **Critical** permits broad administrative compromise; **High** exposes protected data/configuration or disables a principal feature; **Medium** causes significant incorrect behavior or loss of usable state. Confidence and deployment limitations are stated separately.

## Application findings

| ID | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| F01 | Critical | Privileged portal server actions lack caller and target authorization | Source, production action registration, mocked execution |
| F02 | High | Anonymous callers can read and overwrite agent instructions | Source and real-handler execution with mocked GCS |
| F03 | High | Chat APIs accept arbitrary user/session identities without authentication | Source and real-handler execution with mocked upstream |
| F04 | High | Global logout retains chat data across account changes | Source and store/component reproduction |
| F05 | High | Every Mission Control agent is rejected by the current API | Manifest comparison and real-handler reproduction |
| F06 | Medium | Late chat/history responses corrupt the currently selected session | Deferred-promise component reproductions |
| F07 | Medium | Switching agents during initial loading skips the new agent's history | Deferred-promise component reproduction |
| F08 | Medium | Portal user creation disagrees with the committed SQL trigger | Source/SQL comparison and action probe |
| F09 | Medium | Edit/regenerate changes local history but appends to the existing backend session | UI-to-connector trace and component probe |
| F10 | Medium | Storage failures permanently block the chat hydration gate | Malformed-storage and denied-storage reproductions |

### F01 — Privileged portal server actions lack caller and target authorization

**Locations:** `src/app/(superadmin)/superadmin-portal/actions.ts:126`, `:167`, `:211`; `src/app/(admin)/admin-portal/actions.ts:122`, `:157`, `:173`. Unprotected reads also start at `:23` and `:91` in both files. Supporting code: `src/utils/supabase/admin.ts:22`, `src/utils/supabase/middleware.ts:36`, `src/app/(admin)/layout.tsx:12`, `src/app/(superadmin)/layout.tsx:12`.

Both action modules export server functions that immediately instantiate the privileged Supabase client. They never authenticate the caller or check the caller's authoritative role. The superadmin `editUser` accepts an arbitrary `userId` and `role` and updates `user_roles`. Both deletion functions accept arbitrary IDs. The admin action does not enforce the UI's member-only deletion restriction either (`AdminPortalPageContent.tsx:71`).

The layout checks protect page rendering; they do not authorize each action invocation. The proxy refreshes the session and returns the response even when no user exists. The successful production build registered all ten portal exports in `.next/server/server-reference-manifest.json`, confirming these functions were not eliminated as unused code. Next.js also explicitly requires authorization inside server functions; its [authentication guidance](https://nextjs.org/docs/app/guides/authentication) explains why layout checks are insufficient.

**Reproduction/evidence:** Configure the session-client mock to throw if called, and mock only the administrative Supabase operations and cache invalidation. Calling superadmin `editUser('attacker-id', { name: 'Attacker', role: 'superadmin' })` returns success and reaches the role update without consulting the session client. Calling admin `deleteUser('superadmin-id')` reaches the deletion operation equally unconditionally. Existing portal action tests also exercise successful mutations without providing an authenticated caller.

**Impact:** With working server credentials and an obtainable action reference, a caller can elevate an account, delete protected users, create confirmed accounts, or read privileged user information. A legitimate admin can also tamper with target IDs to delete an admin/superadmin. Action-reference obscurity and same-origin checks are not role authorization.

**Direction:** Authenticate and authorize at each privileged entry point, enforce permitted target roles and role transitions server-side, and validate arguments before acquiring privileged access.

**Confidence/limit:** High confidence in the missing checks and registered reachability. No live destructive HTTP request was sent; mutation behavior was verified using mocks.

### F02 — Anonymous callers can read and overwrite agent instructions

**Locations:** `src/app/api/agent/instructions/route.ts:56`, `:75`, `:92`; `src/app/api/agent/instructions/_lib/gcsInstructions.ts:64`; `src/app/(cyberize)/mission-control/layout.tsx:11`.

GET and PUT validate the agent and configuration but perform no authentication or role check. PUT constructs `new Storage()` and writes using the server's Application Default Credentials. Mission Control's admin-only layout does not wrap `/api/agent/instructions`.

**Reproduction:** With GCS mocked, send a request without cookies or Authorization to GET `?agent=architect_agent`, then PUT the JSON body `{"agent_name":"architect_agent","content":"replacement"}`. Both return 200, and `save('replacement', { contentType: 'text/plain' })` is invoked. The probe sets `NEXT_PUBLIC_CHAT_MODE=mock`: the server still performs the GCS operation. The mode flag only selects browser-service behavior.

**Impact:** Anyone able to reach this route on a deployment with working GCS credentials can read instructions or replace a shared agent's instruction object. Backups preserve an earlier copy but do not prevent unauthorized changes. The broken editor in F05 does not mitigate direct calls using a current manifest name.

**Direction:** Require a verified authenticated administrative role on the API itself. If mock deployments must be incapable of writes, enforce that boundary server-side as well.

**Confidence/limit:** Handler behavior is demonstrated. Whether a particular deployment exposes the route publicly and grants ADC write permissions was not available for inspection.

### F03 — Chat APIs accept arbitrary user/session identities without authentication

**Locations:** `src/app/api/agent/run/route.ts:25`, `:47`; `src/app/api/agent/history/route.ts:22`, `:44`; `src/app/api/agent/_lib/adk.ts:164`; `src/utils/supabase/middleware.ts:36`.

Neither route verifies a Supabase session. Both consume `user_id` and `session_id` from the JSON body. The run connector forwards these values as ADK identity, and history constructs its upstream path from them. An optional forwarded Authorization header is not a local identity or ownership check. The browser service normally sends no such header (`src/services/chatService.ts:43`, `:82`).

**Reproduction:** Send an unauthenticated request with a valid manifest agent, `user_id: 'victim'`, and `session_id: 'known-session'`. With upstream fetch mocked, run returns 200 and sends `user_id: 'victim'`; history returns the mocked victim transcript with 200. The session-client mock is never called. The `chat_sessions` RLS policies are irrelevant to these routes because neither consults that table.

**Impact:** Where the upstream accepts these server requests without independently binding identity, callers can read another user's known session, inject messages into it, or initiate agent work without logging in. Transcript access requires a victim identifier and session identifier; this review does not claim arbitrary session enumeration was demonstrated.

**Direction:** Derive user identity from verified server authentication and enforce access to the requested session. Treat upstream service authentication as a separate requirement from end-user authorization.

**Confidence/limit:** The frontend trust-boundary defect is proven. The ADK backend, deployed IAM, and any independent upstream ownership enforcement are outside this repository and were not tested.

### F04 — Global logout retains chat data across account changes

**Locations:** `src/store/useAuthStore.ts:48`; `src/components/auth/Logout.tsx:10`; `src/components/global/NavbarHome.tsx:121`; `src/store/chatStore.ts:39`, `:108`, `:198`; `src/app/(cyberize)/chat/ChatPageContent.tsx:52`, `:107`.

The auth store clears only authentication state. The global navbar's Logout component calls that action without resetting the chat store. Chat messages and session lists survive in its module-level store, and persisted bookmarks are scoped to mode rather than user. When another user signs in, already-loaded messages for a subsequently selected agent bypass a history fetch. Orphan-bookmark adoption can also attach the old account's bookmark to the new account's index.

**Realistic sequence:** User A chats with two agents, navigates Home, and logs out using the global navbar. User B logs in in the same tab and selects A's previously used noninitial agent. That agent's in-memory transcript remains available. Home navigation uses the shared Next.js client runtime; it does not reset module stores.

**Reproduction:** Seed the noninitial agent with `user A secret` and bookmark `private-a`; call the real auth store's logout and login using mocked HTTP responses for user B; mount the real chat orchestrator and switch to that agent. The old message remains, no history request is made, and the component attempts `createSession(otherAgent, 'private-a', 'Restored chat')`.

**Important qualification:** `src/components/layout/CyberizeSidebar.tsx:30` does call `resetChat()` on its logout path. The defect concerns the global navbar path and the lack of a common identity-change boundary, not a claim that every logout omits cleanup.

**Direction:** Centralize identity-scoped state cleanup and ensure bookmarks/caches are owned by the authenticated account. Prevent outstanding requests from repopulating cleared state.

### F05 — Every Mission Control agent is rejected by the current API

**Locations:** `src/app/(cyberize)/mission-control/MissionControlPageContent.tsx:12`; `config/agents.manifest.json:6`; `src/app/api/agent/instructions/route.ts:46`.

Mission Control renders `greeting_agent`, `calc_agent`, `jarvis_agent`, and `product_agent`. The committed manifest instead declares `architect_agent`, `hermes_agent`, `designer_agent`, `devops_agent`, and `ghl_mcp_agent`. There is no intersection. The API rejects all editor agents before attempting storage access.

**Reproduction/evidence:** Invoke the actual GET handler once for each of the four UI names. All four return 400 and none downloads from GCS. PUT has the same known-agent guard. In live mode, opening Mission Control therefore shows four instruction-load errors, and saving any editor also fails. No current agent has an editor. Mock mode masks the mismatch by using the older seeded instruction map.

**Impact:** The live instruction-management feature is entirely unusable with this checkout, independent of valid GCS credentials. Its text also incorrectly promises mock-only storage at `MissionControlPageContent.tsx:31` even though the service has a live write path.

**Direction:** Make the editor's agent selection consistent with the authoritative manifest and test the actual page/service/route combination. Any intentional omission should still select existing agents.

### F06 — Late chat/history responses corrupt the currently selected session

**Locations:** `src/app/(cyberize)/chat/ChatPageContent.tsx:80`, `:118`, `:145`, `:160`, `:169`; `src/components/chat/SessionPanel.tsx:48`, `:53`; `src/store/chatStore.ts:173`.

Async work is associated with an agent, but completion handlers do not verify that the active session or account still matches the request. Messages are stored per agent, so changing sessions replaces the same destination. Session selection and New Chat remain available during a run or history fetch.

**Demonstrated sequences:**

1. Start a first message and delay its response. Click New Chat, which clears the pointer and messages. Resolve the earlier response. Its assistant message is appended into the new empty thread and its old session ID becomes active again. The probe observes an assistant-only thread pointing at `old-session`.
2. After initialization, select session A and then B, delaying both histories. Resolve B, then A. The pointer remains B but the displayed message store contains A's history. Sending next uses B while the user sees A's context.

Both were reproduced with the real orchestrator/store and deferred service promises. There is no cleanup or request-generation guard in either history effect. The composer also checks only send loading, allowing sends during history loading (`src/app/(cyberize)/chat/ChatInput.tsx:31`, `:44`); a subsequent history replacement can erase local messages.

**Direction:** Associate completions with account, agent, session, and request generation; discard obsolete results or store them under their original conversation. Coordinate pending history with sends. Cancellation alone is insufficient if a result has already completed.

### F07 — Switching agents during initial loading skips the new agent's history

**Locations:** `src/app/(cyberize)/chat/ChatPageContent.tsx:70`, `:92`, `:96`, `:101`; `src/components/chat/AgentSwitcher.tsx:19`.

The initial effect captures the selected agent and does not depend on subsequent selections. The switch effect returns while `hasMountedRef.current` is false. Completing initialization changes only a ref; that change is not a dependency that reruns the switch effect. A selection made while the first index/history request is pending can therefore be skipped permanently until the user switches again.

**Reproduction:** Seed session A for `architect_agent` and session B for `hermes_agent`. Delay the initial architect index request, mount chat, then select Hermes. Resolve initialization. The probe confirms Hermes remains selected, only architect history was fetched, and Hermes messages are still undefined. The user sees an empty conversation although B exists.

This is distinct from F06: even if stale writes are ignored, the necessary fetch for the newly selected agent still never occurs.

**Direction:** Make initialization completion reactive or use a unified selection-driven loading lifecycle that always services the latest selection.

### F08 — Portal user creation disagrees with the committed SQL trigger

**Locations:** `src/app/(superadmin)/superadmin-portal/actions.ts:135`, `:157`; `src/app/(admin)/admin-portal/actions.ts:181`; `supabase/setup.sql:95`, `:103`; `src/app/api/auth/signup/route.ts:14`.

The superadmin form calls `addUser` (`src/app/(superadmin)/superadmin-portal/add-user/AddUserForm.tsx:63`). That action puts the selected role and full name into user metadata and assumes a trigger will populate the authoritative tables. The actual trigger in `setup.sql` always inserts role `member` and reads the name from metadata key `name`, while the application sends `full_name`.

**Reproduction on the supplied schema:** Create an Admin using the portal. The action reports success, but the trigger creates `user_roles.role = 'member'` and `profiles.full_name = NULL`. Member creation and the signup route also lose the profile name. A temporary action probe confirms `addUser` only submits metadata and never updates the authoritative role table afterward. The SQL comparison establishes what a database initialized from this repository will do.

The separately protected `/api/auth/superadmin-add-user` route does update `user_roles` explicitly (`route.ts:45`), but the portal form does not call it. This difference does not resolve the portal defect.

**Impact:** Fresh installations silently create the wrong access level and lose profile names. The current action tests verify metadata payloads but never execute the trigger, so they pass despite this integration mismatch.

**Direction:** Align user creation with the versioned schema and verify resulting rows. Do not grant elevated roles merely by trusting self-editable/public-signup metadata.

**Confidence/limit:** Proven for the committed setup SQL. An existing deployment may have a different trigger; its actual schema was unavailable.

### F09 — Edit/regenerate changes local history but appends to the existing backend session

**Locations:** `src/app/(cyberize)/chat/ChatPageContent.tsx:196`, `:221`, `:243`; `src/app/api/agent/_lib/adk.ts:161`, `:168`; `src/store/chatStore.ts:141`.

Editing truncates only the local message array, then sends the replacement text using the existing session ID. Regenerate similarly removes the visible assistant response and sends the last user message again into that same session. The connector sends only `new_message`; it sends no truncation, revision, branch, or replacement instruction to the backend.

**Example:** An ADK session contains U1/A1/U2/A2. Editing U1 makes the UI show U1'/A1', while the backend receives U1' after its existing history. Regenerate sends another copy of a user turn rather than replacing the previous turn. Reloading history can restore the supposedly removed messages, and the agent reasons with context the user believes was removed.

**Verification:** A component probe performs edit and regenerate and observes both calls using the unchanged `session_id: 'existing'`. The connector implementation confirms both are ordinary `/run` calls carrying `new_message`. No backend transcript-mutation API exists in the inspected route/service path.

**Impact:** Visible conversation history misrepresents the context sent to the agent. If an agent performs external actions, rerunning a turn can repeat those actions; actual tool side effects were not tested.

**Direction:** Define and implement backend-consistent edit/regeneration semantics, such as explicit branching or supported revision operations, or accurately constrain the feature until those semantics exist.

**Confidence/limit:** The wire-level mismatch is demonstrated. Exact persisted ADK events after a run were not inspected on a live backend.

### F10 — Storage failures permanently block the chat hydration gate

**Locations:** `src/store/chatStore.ts:123`, `:202`, `:205`, `:227`; `src/app/(cyberize)/chat/ChatPageContent.tsx:278`.

The store initializes `_hasHydrated` to false and sets it true only through `state?.setHasHydrated(true)` in the persistence completion callback. If stored JSON cannot be parsed, the error callback has no state and the flag stays false. If localStorage access throws, storage creation fails and hydration does not run. The UI nevertheless requires that flag before rendering the composer.

**Reproductions:**

1. Store `{invalid JSON` under `adk-session-map-mock`, import the store, and invoke `persist.rehydrate()`. Both `_hasHydrated` and `persist.hasHydrated()` remain false.
2. Make the browser's `localStorage` getter throw `SecurityError` before importing the store. The store exists but has no persistence API and `_hasHydrated` remains false.

Both tests passed. In each case `useHydrationReady()` can never become true; chat stays at “Loading conversation…” indefinitely with no error or recovery control.

**Direction:** Distinguish attempted/finished hydration from successful storage restoration and allow a safe in-memory fallback. Validate or discard malformed persisted data while showing an actionable storage error when appropriate.

## Verification results and testing defects

All commands below ran in the isolated copy, with no live Supabase, GCS, or ADK operations. Environment: Windows PowerShell, Node **24.14.1**, npm **11.13.0**. Locked Next.js version installed: **16.3.3**; the declared range in `package.json` is `^16.2.1`.

| Verification | Result |
| --- | --- |
| `npm.cmd ci --ignore-scripts --no-audit --no-fund` | Succeeded; installed 777 packages. React peer-dependency and deprecation warnings occurred. No lockfile update was requested. |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | Completed without diagnostics. |
| `npm.cmd run build` | Passed compilation, TypeScript, and generation of 24 pages. Dummy public Supabase values, mock chat mode, and disabled Next telemetry were used. No authenticated runtime behavior is established by this result. |
| `npm.cmd test -- --runInBand --silent` | Failed: 37/263 tests and 10/36 suites. A second run captured JSON and reproduced the same counts. |
| Temporary reproduction suite | 13 tests passed across 3 suites, asserting the defective behavior in F01–F10. |
| `npm.cmd run lint` | Failed immediately: `next lint` is treated as a nonexistent project directory. |
| `node node_modules/@playwright/test/cli.js test --list` | Failed while loading Jest files; reported undefined `jest`, `expect`, and `describe`, and zero Playwright tests. No browser tests ran. |
| `npm.cmd audit --omit=dev --json` | Reported 5 affected production dependency nodes: 4 moderate, 1 low; no high/critical findings. These are not five independent application vulnerabilities. See qualification below. |
| Source/config hashes and original git status/diff | 182 source/config files identical; repository clean before report creation. |

### Existing Jest suite is not a usable green baseline

The ten failing suites are:

- `src/__tests__/api/agent-run.test.ts` — 9 failures.
- `src/__tests__/api/agent-history.test.ts` — 7 failures.
- `src/__tests__/api/instructions-route.test.ts` — 8 failures.
- `src/__tests__/chat/SessionPanel.test.tsx` — 6 failures.
- `src/__tests__/chat/ChatPageContent.test.tsx` — 1 failure.
- `src/__tests__/chat/MessageList.loading.test.tsx` — 1 failure.
- `src/__tests__/chat/AgentSwitcher.test.tsx` — 1 failure.
- `src/__tests__/chat/chatStore.persist.test.ts` — 2 failures.
- `src/__tests__/chat/chatStore.modeSplit.test.ts` — 1 failure.
- `src/__tests__/config/manifest.test.ts` — 1 failure.

The stale agent catalog explains much of this: API tests send `jarvis_agent`, which now gets rejected with 400 before their intended fetch/storage assertions. The chat integration test looks for `Ask greeting_agent...` although the default is now `architect_agent`; the switcher test clicks `Jarvis`, a label no longer rendered. These are existing test/fixture mismatches, not 37 independently discovered runtime bugs. They nevertheless prevent the suite from reliably verifying the current configuration.

Security coverage is also materially incomplete: the portal action tests mock privileged operations and expect success without a caller; the nominal API “integration” tests mock upstream fetch/storage. There is no executed database/RLS integration test establishing that portal metadata matches the committed trigger. These gaps explain how F01, F03, and F08 can coexist with passing targeted unit tests.

### Advertised lint and browser-test commands do not work

`package.json:10` invokes `next lint`, which the installed Next.js major no longer provides. The failure was observed directly and is consistent with the [Next.js 16 migration guide](https://nextjs.org/docs/app/guides/upgrading/version-16). No replacement lint configuration/dependency is present in this checkout.

`package.json:13` and `:14` advertise Playwright commands, but there is no Playwright configuration or dedicated browser suite. Default discovery loads the Jest `*.test.ts(x)` files and fails before browser testing. These are demonstrated development/verification defects, recorded separately from the application findings rather than presented as evidence that the build fails.

### Temporary reproduction inventory

The temporary `review/` directory contains `api.review.test.ts`, `chat.review.test.tsx`, and `hydration.review.test.ts`. They import unchanged application modules. The UI orchestration tests use the real chat/auth stores and real chat page, replace presentation children with callback controls, and control async services with deferred promises. They do not simulate a complete browser or live backend.

Run from the temporary copy:

```powershell
node node_modules/jest/bin/jest.js --runInBand --roots ./review --testMatch '**/*.review.test.ts' '**/*.review.test.tsx' --silent
```

The 13 assertions cover: anonymous instruction GET/PUT even in mock mode; all four invalid Mission Control names; anonymous victim-identity run; anonymous victim-session history; role mutation/deletion without caller checks; metadata-only admin creation; stale reply after New Chat; out-of-order session histories; selection during initial load; account change retaining another agent's state; edit/regenerate retaining the backend session; malformed persisted JSON; and denied localStorage access.

Optional raw artifacts remain in the temporary copy: `review-baseline-results.json`, `review-baseline-output.log`, and `review-audit-results.json`. The findings above include their essential evidence so their validity does not depend on retaining temporary files.

## Concerns, tradeoffs, and optional improvements

These are deliberately separate from the confirmed application findings.

- **Dependency advisories require reachability analysis.** The moderate chain is `@google-cloud/storage → retry-request/teeny-request → uuid`; npm proposes a major storage-library upgrade. The [uuid maintainer advisory](https://github.com/uuidjs/uuid/security/advisories/GHSA-w5hq-g745-h8pq) concerns buffered v3/v5/v6 calls. Inspection found `teeny-request/build/src/index.js:135` using `uuid.v4()`, so this review does not claim that call is exploitable. The low `postcss-selector-parser` recursion advisory was reported by npm as GHSA-w9m9-85wc-3x92; attacker-controlled selectors reaching the parser were not demonstrated. Triage the dependency tree without equating audit node counts with exploitable product defects.
- **GCS concurrency can lose a saved intermediate version.** `gcsInstructions.ts:81` copies, then `:90` saves without generation preconditions. Two concurrent saves can both back up version V0, then write V1 and V2; V1 is not necessarily backed up. Last-write-wins may be acceptable, but it does not guarantee preservation of every saved version. Bucket versioning and operational writer concurrency were not inspectable.
- **Instruction read failures become editable content.** `AgentInstructionBlock.tsx:43` places an error message in the editor and enables Save. Once F05 is corrected, a transient read failure followed by Save could overwrite real instructions with that error text. In the current page all four names are invalid, so its writes are rejected; this is recorded as a conditional concern rather than another demonstrated current live write defect.
- **Index failures are silently presented as success.** `sessionIndexService.ts:135` and `:157` swallow rename/archive errors; `SessionPanel.tsx:63` and `:75` update the UI optimistically without rollback. Under a failed write, changes can revert on reload. The intentional nonblocking approach preserves chat availability, but should expose persistence status if users rely on these operations.
- **Mobile drawer accessibility needs browser verification.** `AppShellPage.tsx:217` keeps an `aria-modal` dialog mounted while closed, hides it with translation/pointer-event CSS, and does not remove its controls from keyboard navigation or manage focus. Transforming a drawer offscreen does not itself make its descendants inert. No keyboard/screen-reader walkthrough was executed, so this is an identified accessibility concern rather than a certified conformance assessment.
- **Pagination/scaling deserves an integration test.** Both portal `getUsers` functions fetch all eligible role IDs before querying six profiles (`actions.ts:31`). This depends on the database API's row cap and puts every eligible ID into an `.in()` filter. Larger installations can incur truncation or request-size/performance problems. The deployed row cap and realistic production cardinality were unavailable. The session panel likewise retrieves an unpaginated session list.
- **Error and input contracts are weak at several boundaries.** Run/history cast JSON rather than validate it; malformed client payloads can be reported as upstream 502 errors. History fetch failure becomes indistinguishable from an empty transcript (`chatService.ts:91`), while send failure becomes an assistant response string (`:55`). These are explicit behavior choices, but make operational diagnosis and user recovery harder. No separate availability incident is claimed.
- **Identity has two client/server representations.** The chat page consumes persisted `useAuthStore.user`, while layouts verify Supabase cookies. No central reconciliation initializes that store from an already-valid cookie session or synchronizes account changes across tabs. F04 covers a reproduced leak; other cookie/store divergence scenarios still need authenticated browser testing.

## Positive observations

The committed SQL enables RLS for roles, profiles, and the session index; user role changes are not granted through ordinary user policies. `getUserRole` reads the role table rather than trusting user metadata. The dedicated superadmin-add-user API has explicit authentication and role checks. The manifest constrains upstream selection and URL components are encoded. The ADK connector bounds requests with timeouts and retries session creation only once. GCS saves abort on non-404 backup failures. Chat message content is excluded from localStorage persistence. Markdown uses ReactMarkdown without raw-HTML enablement, and external links include `noopener noreferrer`. These useful protections do not cover the missing authorization boundaries described above.

## Limitations and unreviewed runtime behavior

- No deployed environment, live credentials, authenticated test accounts, or running Supabase/ADK/GCS services were supplied. Database behavior was checked against committed SQL; RLS, triggers, Cloud Run/IAM, ADC permissions, and bucket versioning were not exercised remotely.
- The ADK agent implementation, tools, deployment infrastructure, provider costs, and actual event payloads are outside this repository. Agent effects, backend session ownership checks, and live history semantics could not be fully reviewed.
- The production build used dummy configuration and mock chat mode. It establishes buildability, not live connectivity or safe production operation.
- The repository's Playwright setup could not discover runnable browser tests. UI evidence comes from source inspection and jsdom orchestration tests, not a complete interactive, accessibility, or responsive-layout audit.
- Dependency installation disabled lifecycle scripts. No dependencies were upgraded, and no remediation was attempted.
- No load test, penetration test against deployed systems, or exhaustive proof of absence of vulnerabilities was performed. Report severity assumes the concrete deployment conditions stated in each security finding.

Review complete. No implementation changes were made or are included with this report.
