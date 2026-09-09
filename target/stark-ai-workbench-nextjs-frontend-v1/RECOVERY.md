# Recovery State

**⏸️ REPO PARKED 2026-07-26 — READ `session_2026-07-26.md` FIRST.** It is the
complete re-entry guide: branch topology, module ledger, env/infra state,
architecture cheat-sheet, and the full pending queue. The two headline facts:
(1) **FIX-003 is engineer-complete but UNCOMMITTED** in the `bim-005` working tree
(commit plan in `response_2026-07-20_195136_fix003-execution-result.md`);
(2) **`main` @ `a2da443` does NOT contain BIM-004** — the merge `41fda97` lives only
on `bim-005`; fast-forward main AFTER committing FIX-003. Last verified board:
36 suites / 263 green (07-20) — re-run before trusting.

--- (last working state below) ---

Last action: **FIX-003 Engineer side COMPLETE — green board + ACCEPTANCE_SPEC** —
2026-07-20 19:51, branch `bim-005`. Two QA state defects dead: F09 (persistence now
mode-namespaced `adk-session-map-live`/`-mock`, LIVE-only legacy adoption, mock never
adopts) + F06 (hydration gate — mismatch-safe `useHydrationReady()`, loading idiom
until the persisted selection restores; no wrong-agent flash in chat or panel).
Board: **36 suites / 263 green**, tsc clean, build clean.

Pending: **Coordinator** — manual gates H1–H4 via
`agent_docs/CURRENT_APP/FIX003/ACCEPTANCE_SPEC.md` (headline: the mode-flip walk +
throttled-refresh flash check), then commits FIX-003a/b/c (file lists in
`agent_docs/RESPONSES/response_2026-07-20_195136_fix003-execution-result.md`).
Broader backlog unchanged (BIM-003/004/005 manual passes in progress on this branch;
after gates → fast-forward `bim-005` → `main`).

--- (prior state below) ---

Earlier: **MERGE — `bim-004` into `bim-005`** (2026-07-20). The branch mix-up is
resolved: this line now carries **BOTH** BIM-004 (Projects UX: chat_sessions index,
sessionIndexService, SessionPanel — New Chat / resume / rename / archive, D4 adoption)
AND BIM-005 (Mission Control LIVE: GCS instructions with the backup-before-write law,
ADC credentials). The two modules share zero source files; conflicts were docs + one
test comment, resolved. Combined green board: run post-merge (see session log).
Background: `single-chat-agents` (+ optional BIM-005 fast-forward) preserves the
single-session line; pristine tested single-chat stays frozen at `bim-003`/`main`.

Pending: **Coordinator** —
1. `git add -A && git commit` the resolved merge (Engineer ran zero git; conflict
   files were resolved by edit only).
2. Live-QA pre-steps, ONE TIME EACH: run `supabase/chat_sessions_setup.sql` in the
   Supabase SQL Editor (BIM-004) · grant the SA WRITE on the GCS bucket
   (`roles/storage.objectUser`) + set `GCS_BUCKET`/`GCS_BASE_FOLDER` (BIM-005).
3. Manual-gate backlog, in whatever order suits: BIM-003 spec · BIM-004 spec
   (P-G1 Projects moment) · BIM-005 spec (**C-G4 pirate test**).
4. Still queued: FIX-002/FEAT-001 QA report · BIM-002 lessons L-a…L-d · F04.

--- (prior per-module records below) ---

Earlier: **BIM-005 Engineer side COMPLETE** — 2026-07-20 00:25 (31/232 green; details
in `response_2026-07-20_002531_bim005-execution-result.md`).

Earlier: **BIM-004 Engineer side COMPLETE** — 2026-07-19 19:19 (32/234 green; details
in `response_2026-07-19_191938_bim004-execution-result.md`).

Earlier: **BIM-003 Engineer side COMPLETE — green board + ACCEPTANCE_SPEC** —
2026-07-19 18:42. Agent roster is manifest-driven: `config/agents.manifest.json`
(2 bundles, 5 agents, env-var NAMES only) + validated loader `src/config/manifest.ts`;
routes 400 unknown-agent / 500 naming-the-var; sidebar renders labels; `AgentName`
union retired. Board: baseline 28/197 → **29 suites / 213 green**, tsc clean, build
clean. M-G1 grep proof empty. Zero git/cloud.

Pending: **Coordinator** —
1. ⚠️ Env migration BEFORE live testing: `.env.local` rename `ADK_BUNDLE_URL` →
   `ADK_BUNDLE_URL_V1`.
2. Manual gates via `agent_docs/CURRENT_APP/BIM003/ACCEPTANCE_SPEC.md` §3 (four-line
   test, dual-bundle, error surfaces, loud-failure, mock flip).
3. Commits BIM-003a/b/c/d (file lists in
   `agent_docs/RESPONSES/response_2026-07-19_184207_bim003-execution-result.md`).
4. QA bug report for FIX-002/FEAT-001 still incoming — sequence it vs BIM-003 commits
   as you see fit (BIM-003 overlap: chatStore one line + route tests only).

Earlier today (committed in `f03f08c`): FIX-002 + FEAT-001 engineer-complete; their
RETROSPECTIVEs + module closes await the QA report. BIM002 lesson rulings L-a…L-d and
F04 (ADK semantics) still open.

--- (prior state below) ---

Last action: **FEAT-001 Engineer side COMPLETE — green board** — 2026-07-19 17:29.
Read-aloud rebuilt to spec through the new v2-seed `src/utils/speech.ts` (cleaned
prose, "Code block skipped." announcements, single-owner cancel semantics, unmount
cancel). Drift recorded: message-copy + code-copy already existed on disk (brief said
decorative); input-copy ruled SKIP. Board: **28 suites / 197 tests green**, tsc clean,
build clean. Field note: Tailwind content scanner vs regex char classes (build-only
failure, fixed). Commits FEAT-001a/b + manual script:
`agent_docs/RESPONSES/response_2026-07-19_172910_feat001-execution-result.md`.

ALSO awaiting Coordinator (from earlier today): **FIX-002** manual gates X1–X5 +
commits FIX-002a/b/c (`response_2026-07-19_141545_fix002-execution-result.md`).
FEAT-001 and FIX-002 files have ZERO overlap — stage independently.

Prior context: FIX-002 close-out below.

--- 

Earlier: **FIX-002 Engineer side COMPLETE — green board** — 2026-07-19 14:15.
QA triple-fix done: F01 selection persists (`partialize` + `selectedAgent`), F02
"Loading conversation…" state on history fetches, F03 sentinel reads "Agent Service".
Baseline 25/174 → **26 suites / 180 green**, tsc clean, build clean. X6: exactly 2
pre-existing test files touched at sanctioned pins. Zero git/cloud by Engineer.

Pending: **Coordinator** — manual gates X1–X5 (script in
`agent_docs/RESPONSES/response_2026-07-19_141545_fix002-execution-result.md`), then
commits FIX-002a/b/c + docs (file lists in the same artifact). RETROSPECTIVE.md at
module close. Also still open: lesson rulings L-a…L-d (BIM-002), F04 (deferred, ADK
semantics), N11-evening docs commit if not yet made.

--- (prior state below) ---

Last action: **BIM-002 Engineer side COMPLETE — green board** — 2026-07-18 17:20. The
wrapper's brains are ported: both agent routes now speak native ADK api_server protocol
via `src/app/api/agent/_lib/adk.ts` (session bootstrap, not-found→create→retry-once,
reversed-event response selection per FLAG-1 `content.role === "model"`, history
normalization). `ADK_WRAPPER_URL` fully retired from code + `.env.example` (R1);
`ADK_BUNDLE_URL` is the one server-only var. Board: baseline 24/149 → **25 suites /
174 tests green**, tsc clean, build clean, N9 advisory grep clean. Zero git/cloud ops
by Engineer.

**BIM-002 CLOSED 2026-07-18 19:52 (pending N11 ceremony).** Coordinator + Stark QA
confirmed all gates green: N4 · N5 · N6 (supplied-id creation adjudicated spec-correct
per A2.3) · **N7 OUTCOME A** — the T0 native probe returned events, convicting the
wrapper's /get_history as the root cause of the lifetime empty-history defect;
reload-history fixed free by the port · N8 · N3 · N9. jest.config deviation RATIFIED
(QA factory lesson: config files conditionally writable when reported).
RETROSPECTIVE.md written (4 lesson candidates PROPOSED, not written). QA findings
F01–F03 routed to future FIX-002; F04 deferred pending ADK semantics.

**N11 CEREMONY COMPLETE — 2026-07-18 evening (Coordinator-confirmed).** The wrapper's
Cloud Run service is paused and the system runs without it. The wrapper is formally
retired with honors. **BIM-002 is fully CLOSED.**

Pending: **Coordinator** —
1. Docs commit if not yet made (file list in session log 19:52 entry).
2. Rulings on lesson candidates L-a…L-d (filenames proposed in BIM002/RETROSPECTIVE.md).

Next step: FIX-002 authoring (F01–F03) when the Architect picks it up. Carried items:
F04 (ADK semantics), merge-precedence revisit when profileService goes real, R2 public
endpoints tracked.

---

## 3-second summary

- BIM-001 CLOSED · FIX-001 CLOSED · **BIM-002 CLOSED (ceremony pending)** — UI →
  routes → ADK bundle, no middleman; wrapper convicted post-mortem on the history bug.
- Board: 25 suites / 174 tests, tsc clean, build clean. Docs commit + N11 = Coordinator.
- Only known breakage: `npm run lint` (pre-existing B1, out of scope).
