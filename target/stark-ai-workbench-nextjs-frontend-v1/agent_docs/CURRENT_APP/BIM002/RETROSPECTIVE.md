# BIM-002 — RETROSPECTIVE — FINAL (module CLOSED 2026-07-18, pending N11 ceremony)

_Coordinator + Stark Industries QA confirmed all gates green 2026-07-18 ~19:50:
N4 · N5 · N6 (supplied-id nuance adjudicated) · **N7 OUTCOME A** · N8 · N3 · N9.
The wrapper's Cloud Run pause (N11) is the Coordinator's post-close ceremony._

## What shipped

UI → route handlers → **ADK bundle, no middleman.** The wrapper's three jewels ported
into `src/app/api/agent/_lib/adk.ts` (session bootstrap, not-found→create→retry-once
under one 90s deadline, reversed-event response selection); both routes became thin
orchestrators with frozen signatures; `ADK_WRAPPER_URL` retired for `ADK_BUNDLE_URL`
(R1). Board: baseline 24/149 → **25 suites / 174 tests**, tsc clean, build clean, N9
client-bundle grep clean. Engineer ran zero git and zero cloud commands across the
module.

## What fought back (the field notes that matter)

1. **The FLAG-1 author-predicate catch.** R5's wording said "author `model`" — but real
   ADK events carry `author: "<agent_name>"` (e.g. `greeting_agent`) with
   `content.role: "model"`. A literal port of the ruling's wording would have shipped a
   response selector that **never matches a single real event** — every live run would
   have 502'd with "No model response in events" despite a healthy bundle. Caught at
   plan time by checking the spec against real event anatomy rather than porting the
   sentence; ruled predicate `content.role === "model"`, dual-style fixtures made
   mandatory so both anatomies stay pinned forever.

2. **The jest.config zone deviation (ratified).** The plan placed fixtures at
   `src/__tests__/api/fixtures/` — but Jest's `testMatch` collects every `.ts` under
   `__tests__/` as a suite, and a data-only module fails as "suite with no tests." The
   fix was a one-line `testPathIgnorePatterns` addition to `jest.config.js` — a file
   outside the Brief §4 writable list. Deviation taken, flagged in the same breath,
   ratified by QA. **The QA factory lesson: config files are conditionally writable when
   the change is (a) demanded by in-scope work, (b) minimal, and (c) reported for
   ratification in the execution artifact — silent config edits remain forbidden.**

3. **N7 OUTCOME A — the campaign's biggest post-mortem finding.** The T0 probe (native
   `GET .../sessions/S` seconds after a live reply, *before* reload) returned the
   events. The ADK store persists and serves fine — which convicts the **wrapper's
   `/get_history` path** as the root cause of the empty-history mystery that failed
   FIX-001's F1 transcript display and had *never worked in the system's lifetime*.
   Three modules of evidence converged: FIX-001 proved the pointer survives and the id
   matches end-to-end; BIM-002's native path proved the store serves; the only
   component ever between them was the wrapper. Reload-history was fixed **for free**
   by deleting the middleman — the defect was never re-implemented, merely not ported.
   The wrapper retires with honors and one confirmed conviction.

4. **The N6 supplied-id nuance (adjudicated spec-correct).** When a *supplied* session
   id hits the not-found signature, the connector creates **that exact id** and retries
   — it does not mint a fresh `session-${Date.now()}`. QA questioned it; adjudication:
   spec-correct per A2.3 §2 (the retry-once loop recreates the session it was asked
   for; only a null/absent id triggers generation per §1). Consequence worth knowing:
   a stale persisted pointer self-heals by resurrecting the *same* session id with
   empty history, which is also what keeps FIX-001's localStorage pointer coherent
   without a write-back.

5. **Provenance gap, closed at runtime.** The create/run endpoint paths were CLAIMs
   (wrapper `main.py` never lived in this repo); only the history GET had disk
   evidence. Flagged at plan, proven live at N4/N5 with zero deviation. The flag was
   still correct process: had the bundle 404'd the create path, the plan said report,
   don't improvise.

## QA findings routing (recorded per Coordinator directive)

- **F01, F02, F03** — routed to a future **FIX-002** module (authoring owned by the
  Architect; not begun, not scoped here).
- **F04** — **deferred pending ADK semantics** clarification; revisit when the relevant
  ADK behavior is pinned down.

## Carried items for the BIM ladder

- N11 ceremony: pause wrapper Cloud Run → one more live message → formal retirement
  (Coordinator, post-close).
- FIX-002: F01–F03 (above).
- From FIX-001: revisit `ChatPageContent` merge precedence when `profileService` goes
  real.
- R2 stands: endpoints remain public — tracked risk, deferred again.

## Lesson candidates (PROPOSED ONLY — Architect rules before writing)

| # | Proposed filename (`agent_docs/LESSONS/`) | Lesson |
|---|---|---|
| L-a | `2026-07-18_La_spec-wording-vs-payload-anatomy.md` | Port specs written in prose ("author model") must be checked against the real payload anatomy before build — one wrong noun in a ruling can make a feature 0%-functional while every unit test passes. Fixtures must encode the *real* shapes, dual-style when the era is ambiguous. |
| L-b | `2026-07-18_Lb_config-files-conditionally-writable.md` | Test/build config files sit outside module writable zones but are conditionally writable: minimal, demanded by in-scope work, flagged for ratification in the same artifact. Silent config edits stay forbidden. (QA-endorsed this module.) |
| L-c | `2026-07-18_Lc_delete-the-middleman-post-mortem.md` | When a defect has never worked in system lifetime and the suspect layer is scheduled for demolition, a diagnostic gate on the replacement (T0 probe pattern) can convict the old layer post-mortem instead of debugging doomed code — and the fix arrives free with the port. |
| L-d | `2026-07-18_Ld_retry-recreates-the-asked-for-id.md` | Self-healing retry loops should resurrect the identifier they were asked for, not mint a new one — it keeps client-side persisted pointers coherent without write-back machinery. Adjudicate this class of nuance against the contract *before* QA has to ask. |

## Final gate board

N1 ✅ (plan-ruled) · N2 ✅ · N3 ✅ · N4 ✅ · N5 ✅ · N6 ✅ (adjudicated) ·
**N7 ✅ OUTCOME A** · N8 ✅ · N9 ✅ · N10 ✅ (24/149 → 25/174, tsc, build) ·
N11 ⏳ ceremony pending.

_Module trail: plan `response_2026-07-18_163153_bim002-preflight-plan.md` · execution
`response_2026-07-18_172056_bim002-execution-result.md` · this retrospective._
