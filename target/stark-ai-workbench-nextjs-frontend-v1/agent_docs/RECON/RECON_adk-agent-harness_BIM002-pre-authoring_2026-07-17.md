# RECON REPORT — adk-agent-harness · BIM-002 pre-authoring

> **Run type:** Re-scoped stark-recon (Day-0 sweep + Surprises), targeted at the BIM-002
> surface. Ordered by Operator against current `main` (post BIM-001 merge). No assumption
> checklist — there is no draft module to validate; this is the evidence base the
> Architect authors BIM-002 from.
> **Date:** 2026-07-17 (clock rolled to 2026-07-18 ~00:16 +06 during assembly).
> **Verifier:** Claudy (Engineer). Read-only of codebase; read-only git queries only.
> **Skill:** stark-recon v1.1. Label legend: EVIDENCE / INFERENCE / CLAIM / GAP / QUESTION.

---

## HEADLINE

- **`main` == `bim-002` HEAD** (`git diff main HEAD --stat` empty) — recon target and working
  branch are byte-identical. BIM-001 is merged; the merge commit `2f19a76` carried **docs
  only** (CHANGELOG, RECOVERY, RETROSPECTIVE, session log, 2 RESPONSES) — **zero source drift**.
- **Green board:** 23 suites / 144 tests pass (6.9s), `tsc --noEmit` exit 0, `next build`
  clean (24 routes). Matches RECOVERY.md's claim exactly — no historical-count drift.
- **BIM-002 surface is exactly two files** (`/api/agent/run/route.ts`,
  `/api/agent/history/route.ts`) plus the frozen `chatService.ts` seam above them. Route
  signatures are the locked contract; only the route *internals* get ported.
- **Top surprises:** an orphan `src/app/api/auth/logout/route-1.ts` (a second POST handler
  file that differs from `route.ts` — kit fossil, not BIM-002-related but live in the tree);
  and **`.env.local` currently has `NEXT_PUBLIC_CHAT_MODE=live`** — the repo is sitting in
  LIVE mode right now, not the mock default.

---

## Day-0 Ground-Truth Sweep

### Git / merge state (the "any drift the merge introduced" question)
- **EVIDENCE:** `git branch --show-current → bim-002`; `git diff main HEAD --stat → (empty)`.
  Working branch and `main` are identical. Nothing local diverges from merged `main`.
- **EVIDENCE:** Merge/close commit `2f19a76 "bim001 done"` touched **only docs**:
  `CHANGELOG.md`, `RECOVERY.md`, `agent_docs/.../RETROSPECTIVE.md`, two `RESPONSES/*.md`,
  `session_2026-07-17.md` (6 files, +244/−39). `git show --stat 2f19a76` lists **no `src/`
  path**. → **The merge introduced zero source drift.** The BIM-002 surface on `main` is
  identical to what BIM-001 shipped and tested.
- **EVIDENCE:** BIM-001 source commits are all in history:
  `aa2ff05` (routes+tests) · `ca8a915` (chatService live mode+tests) · `4aee9ac` (env+changelog).

### Test runner + green status (the "current test count and green status" question)
- **EVIDENCE:** `grep '"test"' package.json → "test": "jest"` (+ `"test:integration": "jest
  --testPathPatterns=__tests__/api"`). Jest 30.0.5, ts-jest 29.4.1, jsdom env. **Not Vitest.**
- **EVIDENCE:** `npx jest → Test Suites: 23 passed, 23 total · Tests: 144 passed, 144 total ·
  Time 6.875s`. Fresh run, not a historical count. Matches RECOVERY.md's 23/144 exactly.
- **EVIDENCE:** `npx tsc --noEmit → exit 0` (no output). Clean typecheck.
- **EVIDENCE:** `npm run build → ✓ Compiled successfully · Finished TypeScript · 23/23 static
  pages · Next.js 16.2.6 (Turbopack)`. 24 routes surfaced (table below).
- **EVIDENCE (agent surface tests present):** `src/__tests__/api/agent-run.test.ts` and
  `agent-history.test.ts` exist — the two BIM-002 targets are already under test coverage.

### `/api/agent/*` route handlers as landed (the primary BIM-002 target)
- **EVIDENCE:** `src/app/api/agent/run/route.ts` (48 lines) — `POST` handler, thin proxy.
  Reads `process.env.ADK_WRAPPER_URL` (500 if unset), forwards raw request body verbatim to
  `${wrapperUrl}/run_agent`, passes through an optional `Authorization` header ("reserved auth
  slot (Brief §7)"), returns upstream text+status verbatim, `catch → 502 {error}`.
  `export const maxDuration = 90`; `RUN_TIMEOUT_MS = 90_000` via `AbortSignal.timeout`.
- **EVIDENCE:** `src/app/api/agent/history/route.ts` (44 lines) — same shape, forwards to
  `${wrapperUrl}/get_history`, `HISTORY_TIMEOUT_MS = 30_000`, no `maxDuration`. Comment notes
  the *service* (not the route) unwraps `.history` — "routes speak HTTP, services speak contract."
- **INFERENCE:** Both routes are **deliberately zero-intelligence proxies** (their own
  header comments say so). BIM-002 ("Kill the Wrapper") ports the wrapper's brains *into*
  these internals — session `create_session`, the 404→create→retry-once loop, reversed-event
  parsing — per DATA_CONTRACT_AMENDMENT §A1.6. The `POST(req)` **signatures do not change**;
  that is the whole point of the Phase-A/Phase-B split. Confirmed by the §A1.6 text on disk.

### chatService live mode (the "chatService live mode" question)
- **EVIDENCE:** `src/services/chatService.ts` (123 lines). Mode gate:
  `const isLive = () => process.env.NEXT_PUBLIC_CHAT_MODE === 'live'` (read at call time).
  Any other value / unset → mock path. Two methods:
  - `sendMessage`: live → `POST /api/agent/run`, 90s timeout; on any failure **resolves**
    (never throws) with the D1(b) sentinel `{ response: "Error: Could not reach Agent Wrapper.
    Details: <e>", session_id: input.session_id ?? '' }`; `response` defaults to
    `"Error: No response content."` if missing. Mock → `generateMockResponse` after 1000ms.
  - `getHistory`: live → **falsy `session_id` guard returns `[]` with zero HTTP**, else
    `POST /api/agent/history`, unwraps `.history ?? []`; any failure → `console.error` + `[]`
    (history failure must never block chat). Mock → `mockMessagesBySession[session_id] ?? []`.
- **EVIDENCE:** Signatures unchanged from FFM contract (`RunAgentRequest → RunAgentResponse`,
  `GetHistoryRequest → Message[]`). The in-file `BACKEND_SWAP_NOTES` block (lines 102-122)
  documents that Phase B swaps **only route internals** — this service and everything above it
  stay put.
- **EVIDENCE (consumers):** the only non-test caller is
  `src/app/(cyberize)/chat/ChatPageContent.tsx` (4 call sites: 1 `getHistory`, 3 `sendMessage`)
  + the barrel `src/services/index.ts`. Small, contained blast radius.

### Forbidden-zone greps (kit health)
- **EVIDENCE:** `dangerouslySetInnerHTML → 0 hits`. `user_metadata.(is_|role) → 0 hits`. Clean.
- **EVIDENCE (`: any` / `as any`):** All hits are **test files** (`src/__tests__/**`, ~45 sites
  — normal mock-casting) **plus three known kit baseline sites, none in the BIM-002 surface**:
  - `src/store/useAuthStore.ts:6 → user: any | null` (pre-existing kit `user: any` smell —
    the classic auth-store type gap; **out of BIM-002 scope**, flag for a future auth-domain pass).
  - `src/utils/supabase/server.ts:6 → (await cookies()) as any` (Next 16 cookies cast, kit).
  - `src/components/ui/command.tsx:35 → {children as any}` (shadcn primitive — the same orphan
    flagged in the Cyber Pharma example; unimported? see Surprises).
  - `src/app/(cyberize)/chat/MessageBubble.tsx:85 → style={codeTheme as any}` (syntax-highlight
    theme cast, chat domain, pre-existing).
  → **No new `any` introduced by BIM-001; the agent routes + chatService are `any`-free.**

### Env ground-truth (from `.env.example` + `grep process.env`, not docs)
- **EVIDENCE — BIM-002-relevant vars:**
  - `ADK_WRAPPER_URL` — **server-side only, no `NEXT_PUBLIC_` prefix** (never reaches client
    bundle). Used 12× in src, only in the two agent routes + their two test files. `.env.example`:
    `https://your-wrapper-service.your-region.run.app`.
  - `NEXT_PUBLIC_CHAT_MODE` — `'mock' | 'live'`, anything else → mock. Used 7× (chatService +
    tests). `.env.example` ships `=mock` (fail-safe default).
- **EVIDENCE — kit vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  (Q4-2025 naming — "used to be anon key"), `SUPABASE_SECRET_KEY` (server-only, "used to be
  service_role"), `NEXT_PUBLIC_SITE_URL`. All present in `.env.example`, all referenced in code.
  **No stale anon/service_role naming drift** — env names match code.
- **⚠️ EVIDENCE — LIVE MODE IS ON:** `.env.local` currently contains
  `NEXT_PUBLIC_CHAT_MODE=live` (with `# NEXT_PUBLIC_CHAT_MODE=none` commented above it). The
  running local config is **live-wired to the real wrapper**, not the mock default. This is
  the correct state for the just-completed live-verification, but the Architect/Operator
  should know the repo is not sitting at the fail-safe default right now. `.env.local` is
  gitignored — this does not ship, but it governs `npm run dev`/`build` locally.

### Build route table (ground truth for surfaces)
```
ƒ /                              ○ /_not-found              ƒ /admin-portal
ƒ /admin-portal/add-member       ƒ /admin-portal/edit/[id]
ƒ /api/agent/history   ← BIM-002  ƒ /api/agent/run   ← BIM-002
ƒ /api/auth/confirm    ƒ /api/auth/login    ƒ /api/auth/logout    ƒ /api/auth/signup
ƒ /api/auth/superadmin-add-user
○ /auth    ƒ /chat    ○ /demo    ○ /error    ƒ /members-portal
ƒ /members-portal/profile    ƒ /mission-control    ƒ /profile
ƒ /superadmin-portal    ƒ /superadmin-portal/add-user    ƒ /superadmin-portal/edit/[id]
○ /template
ƒ Proxy (Middleware)
```
- **EVIDENCE:** Both agent routes surface as dynamic (`ƒ`) server routes — correct for
  proxies. Middleware surfaces as **"Proxy (Middleware)"** — Next 16 `src/proxy.ts`
  convention confirmed (no `middleware.ts`).
- **Note:** `route-1.ts` under `api/auth/logout/` does **not** surface as its own route
  (Next only routes `route.ts`) — it's dead weight on disk, see Surprises.

---

## Stack Versions (quick reference)
- Next.js: **16.2.1** (package.json) / build reports **16.2.6** runtime · React **19.2.4**
- TypeScript: **^5** · Tailwind: **3.4.1** → token mechanic = **HSL/config** (not @theme/OKLCH)
- Zustand: **4.5.4** · Test runner: **Jest 30** (jsdom + ts-jest)
- Node: not pinned (no `.nvmrc`, no `engines.node`) — **GAP** (minor; unchanged from prior recons).

---

## Section 10 — Surprises (the gold)

1. **ORPHAN — `src/app/api/auth/logout/route-1.ts`** (QUESTION/cleanup candidate).
   A second POST handler file sitting beside `route.ts` in the logout dir. `diff` confirms it
   **DIFFERS** from the live `route.ts`. Next.js ignores it (only `route.ts` routes), so it's
   inert — but it's an un-owned fossil the merge did not remove. Not BIM-002-related. Recommend
   the Operator confirm-and-delete in a cleanup pass. **Do not let the Architect scope BIM-002
   around it — it's noise.**

2. **⚠️ `.env.local` is in LIVE mode** (EVIDENCE, already flagged above). The repo's local
   runtime is `NEXT_PUBLIC_CHAT_MODE=live` — pointed at the real Cloud Run wrapper. Anyone who
   runs `npm run dev` right now hits the live agent, not mocks. Intentional post-verification
   state, but worth a conscious "flip back to mock when not actively live-testing" note.

3. **`command.tsx` `as any` orphan** (INFERENCE) — `src/components/ui/command.tsx:35
   {children as any}`. Same shadcn primitive flagged as unimported in the Cyber Pharma recon
   example. Likely still zero-consumer here. Low priority; not BIM-002. Cleanup candidate.

4. **Kit `user: any` in `useAuthStore.ts:6`** (EVIDENCE) — the auth store still types `user`
   as `any | null`. Pre-existing kit smell, untouched by BIM-001, **outside BIM-002 scope**
   (chat domain). Logged so a future auth-domain reconciliation task can pick it up; the
   Architect should NOT fold it into BIM-002.

5. **Two `chatService` mock delays are still live in the file** (`SEND_DELAY_MS = 1000`,
   `HISTORY_DELAY_MS = 200`) — only used on the mock branch. They stay (mock is the fail-safe
   default and must keep working). Just noting they're intentionally retained, not dead.

6. **BIM-002 port spec is already on disk** — `agent_docs/CURRENT_APP/BIM001/
   DATA_CONTRACT_AMENDMENT.md §A1.6` names the exact port target: wrapper's `create_session`
   (`POST /apps/{app}/users/{user}/sessions/{id}`), the 404→create→retry-once loop, and
   reversed-event-array parsing for the final `model` text part — "all confirmed in wrapper
   `main.py`." Route signatures frozen. The Architect has a written port target; no re-derivation
   needed.

7. **No demo-cascade / cross-project residue in the BIM-002 blast radius** — residue grep
   (`Your Company`, `Acme`, `TODO`, `jsonplaceholder`, `dummyjson`) → **0 hits in src**. The
   `/demo` and `/template` routes are kit scaffolding (present, inert), not tangled into chat.
   `agent_docs/**` `.ts` template stubs exist but are **excluded** by `tsconfig` (`"exclude":
   ["node_modules", "agent_docs/**"]`) — they will not enter compile scope. FFM-packaging trap
   is closed.

8. **`npm run lint` is broken** (EVIDENCE) — `next lint` errors with *"Invalid project
   directory provided, no such directory: .../lint"*. This is the pre-existing **B1** issue
   (out of scope per AM-1), and it's a **`next lint` invocation bug**, not a code-quality
   signal. Lint provides no coverage right now; `tsc` + Jest are the real gates. Flag for a
   future tooling fix, not for BIM-002.

---

## RECOMMENDATION TO ARCHITECT

**Verified facts the BIM-002 brief can be authored against without re-verification:**
- The port surface is **exactly two files**: `src/app/api/agent/run/route.ts` and
  `.../history/route.ts`. Their `POST(req: Request)` signatures are frozen; BIM-002 replaces
  only the internals (forward-to-wrapper → own the session/create/retry/parse logic). §A1.6
  is the written spec.
- `chatService.ts` and its single consumer `ChatPageContent.tsx` **do not change** in BIM-002.
  The seam is below them, at the route handlers. Contract (snake_case wire format, D1(b)
  sentinel, falsy-session `[]` guard) is locked.
- Green baseline to preserve: **23 suites / 144 tests, tsc exit 0, build clean**. The two
  agent routes already have test files (`__tests__/api/agent-run.test.ts`,
  `agent-history.test.ts`) — BIM-002 must keep them green (and likely extend them for the
  ported session logic).
- Env contract: `ADK_WRAPPER_URL` (server-only) and `NEXT_PUBLIC_CHAT_MODE` (mock|live,
  fail-safe mock). BIM-002 "kills the wrapper," so the Architect must decide what
  `ADK_WRAPPER_URL` points at post-port (ADK API server base URL directly?) — **OPEN QUESTION**.
- Mock mode is the shipped default and must survive BIM-002 untouched (fail-safe).

**Drift to surface in doctrine:** none material from the merge — merge was docs-only, source
is identical to tested BIM-001. RECOVERY.md's 23/144 + green claims **verified accurate**
(no historical-count drift, the L26 trap did not bite).

**Cleanup candidates (NOT for BIM-002 — separate authorized pass):**
- `src/app/api/auth/logout/route-1.ts` — orphan duplicate handler, delete after Operator confirm.
- `src/components/ui/command.tsx` `as any` (likely unimported).
- `useAuthStore.ts:6 user: any` — future auth-domain reconciliation.
- `next lint` invocation bug (B1) — tooling fix.
- Flip `.env.local` back to `mock` when not actively live-testing.

**Open questions for the Operator/Architect:**
- **Q1:** After BIM-002 kills the wrapper, does `ADK_WRAPPER_URL` re-point to the ADK
  `api_server` base URL, or does a new env var replace it? (§A1.6 implies the routes will call
  ADK's `/apps/{app}/users/{user}/sessions/*` directly.)
- **Q2:** Wrapper auth (`Authorization` "reserved auth slot") is still a pass-through no-op —
  does BIM-002 wire real auth to the ADK server, or is that deferred again? (BACKEND_SWAP_NOTES
  Open Question 4 remains unresolved.)
- **Q3:** Reload-persistence (the BIM-001 G6 finding) is owned by the still-mocked
  `profileService` — is that in or out of BIM-002 scope? (Prior ruling: it lands free when the
  profile module goes live; BIM-002 is chat-only, so likely **out**.)

---

*End of recon. Read-only run — repo left byte-for-byte unchanged, zero git mutations.*
