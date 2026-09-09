# BIM-002 — Preflight Plan (PENDING_APPROVAL)

_2026-07-18 16:31 · Engineer: Claudy · Module: BIM-002 (Native Connector — Kill the Wrapper)_
_Incorporates the launch amendment: N7 upgraded to DIAGNOSTIC gate._

## 1. N1 — Endpoint-path verification (port-spec vs disk)

| Op | Port spec (A2.2) | Disk verdict |
|---|---|---|
| History | `GET {ADK_BUNDLE_URL}/apps/{agent}/users/{user_id}/sessions/{session_id}` | **EVIDENCE — CONFIRMED on disk.** Pre-wrapper `chat-org.py` fetched history from exactly this path against the ADK server (`_extraction/00-REPO-PROFILE.md:194`, `_extraction/10-RAW-FINDINGS-AND-QUESTIONS.md:40`). |
| Create session | `POST {ADK_BUNDLE_URL}/apps/{agent}/users/{user_id}/sessions/{session_id}` (empty JSON body) | **CLAIM with provenance.** Cited as "confirmed in wrapper main.py" by A1 §A1.6 + BIM-000 Stage-B §84 — but wrapper `main.py` is NOT in this repo (verified: no main.py, no reference/). Path matches ADK `api_server` convention. No disk contradiction. Runtime proof lands at N4/N5. |
| Run | `POST {ADK_BUNDLE_URL}/run` body `{app_name, user_id, session_id, new_message:{role:"user", parts:[{text}]}}` → event array | **CLAIM with provenance** (same basis). Matches ADK `api_server` convention. No disk contradiction. Runtime proof at N4. |

**No deviation found between port spec and available disk evidence.** The only gap is
provenance (wrapper source absent from this repo) — flagged, not a blocker; the live gates
are the proof.

## 2. FLAGS FOR RULING (per manager: flag, don't silently deviate)

**FLAG-1 — R5 "model-authored" predicate.** Canonical ADK events carry
`author: "<agent_name>"` (e.g. `"greeting_agent"`) with `content.role: "model"` — the
literal string `author === "model"` may never match real events. Proposal: the connector's
predicate is **`content.role === "model"` with a text part** (response selection = reversed
scan for the last such event; history mapping: `content.role === "model"` → `assistant`,
`content.role === "user"` → `user`; non-text parts skipped). Fixtures encode BOTH author
styles so either wrapper-era shape parses. This preserves R5's intent (the wrapper's
observable output) against real event anatomy. → Ruling requested.

**FLAG-2 — N2 vs the BIM-001 route tests.** `agent-run.test.ts` + `agent-history.test.ts`
assert the retired proxy protocol itself: forwards to `{ADK_WRAPPER_URL}/run_agent`,
verbatim body pass-through, non-2xx status passthrough, 500 on unset `ADK_WRAPPER_URL`.
Those assertions CANNOT stay green after the port — the protocol they pin is the thing
being replaced (R1 retires the env var). They live inside the writable zone
(`src/__tests__/api/**`, Brief §4). Proposal: **rewrite both files to the native
contract**, preserving every overlapping behavioral guarantee: Authorization pass-through
(R2) · 500 `{error}` + zero HTTP on unset env (now `ADK_BUNDLE_URL`) · 502 `{error}` on
upstream failure · timeout signal present · frozen external response shapes
`{response, session_id}` / `{history}`. All tests OUTSIDE `__tests__/api/**` pass
byte-unmodified (services/chat/components — N2/N3). → Ruling requested.

## 3. Files (created / modified, with rationales)

| File | Action | Why |
|---|---|---|
| `src/app/api/agent/_lib/adk.ts` | CREATE | The connector: `createSession`, `runAgent` (deadline-budgeted, retry-once), `extractResponseText` (reversed scan), `normalizeHistory`, `isSessionNotFound`, `newSessionId` (`session-${Date.now()}`, R4). Pure functions where possible — fixture-testable without HTTP. |
| `src/app/api/agent/run/route.ts` | MODIFY (internals only) | Thin orchestrator: parse body → falsy `session_id` → generate+create (N5) → run → session-not-found → create+retry once (N6) → extract text → `{response, session_id}`. `POST(req)` signature + `maxDuration = 90` unchanged. Auth header forwarded verbatim (R2). |
| `src/app/api/agent/history/route.ts` | MODIFY (internals only) | GET native session → normalize events → `{history}`. 30s budget. Signature frozen. |
| `src/__tests__/api/fixtures/adk-events.ts` | CREATE | The oracle fixtures (list below). |
| `src/__tests__/api/adk-lib.test.ts` | CREATE | Unit tests for parse/normalize/retry/session-id against fixtures. |
| `src/__tests__/api/agent-run.test.ts` | REWRITE (FLAG-2) | Native-contract route tests, overlapping guarantees preserved. |
| `src/__tests__/api/agent-history.test.ts` | REWRITE (FLAG-2) | Same. |
| `.env.example` | MODIFY | R1: `ADK_BUNDLE_URL` in (structural placeholder ONLY, AM-2), `ADK_WRAPPER_URL` out. |
| CHANGELOG / session log / RECOVERY / BIM002 RETROSPECTIVE | protocol docs | Definition of done. |

**NOT touched:** `chatService.ts`, `ChatPageContent.tsx`, every store/component/type/page,
`profileService`/`instructionsService`, all tests outside `__tests__/api/**`, the wrapper
repo/cloud, kit noise.

## 4. Timeout budget (Brief §7 risk: the arithmetic stated)

Run path: **one 90s deadline** captured at entry (`deadline = Date.now() + 90_000`); every
fetch gets `AbortSignal.timeout(remaining(deadline))`. Split: primary run ≤ 75s · create
≤ 10s · retry gets whatever remains (≥ 5s if primary consumed its max; typical
session-not-found fails in <2s so retry practically inherits ~78s). Deadline exceeded at
any step → 502. History: flat 30s. `maxDuration = 90` retained.

## 5. Fixture list (`adk-events.ts` — the encoded oracle)

1. `happyPathEvents` — single model text event (canonical: `author: "greeting_agent"`, `content.role: "model"`).
2. `multiEventRun` — function_call event + intermediate + final model text (reversed scan must select the LAST model text).
3. `authorModelStyle` — same but `author: "model"` (FLAG-1 dual-style tolerance).
4. `sessionNotFound404` — `{detail: "Session not found"}` + 404 (retry trigger).
5. `emptyEvents` — `[]` (→ 502 "No model response in events").
6. `malformedEvents` — events without parts / non-text parts only (→ 502, never a crash).
7. `historySession` — session object: mixed user/model turns + a non-text event to skip; expected `Message[]` alongside (order oldest→newest).
8. `historyEmptySession` — session with `events: []` (the N7 scenario — normalizes to `{history: []}` without error).

## 6. Test plan → gates

| Gate | Automated proof | Manual proof |
|---|---|---|
| N1 | (this plan §1) | Ruled at review |
| N2 | Full suite: everything outside `__tests__/api` byte-unmodified and green | — |
| N3 | Service/component suites unchanged | Coordinator: mock flip spot-check |
| N4 | — | Script step 2 (wrapper var absent, real answer) |
| N5 | Unit: null session → generate+create+run call sequence | Script step 1 (virgin chat) |
| N6 | Unit: 404 fixture → exactly 1 create + 1 retry → success; retry fails → 502; non-404 error → 502 no retry | Script step 4 (bogus stored id self-heals) |
| N7 | Unit: `historySession` normalizes correctly; `historyEmptySession` → `[]` | **DIAGNOSTIC script §7 below** |
| N8 | Route tests: env unset → 500 + zero HTTP; unreachable → 502; malformed → 502 | Script step 5 (bundle URL bogus → sentinel bubble, no crash) |
| N9 | — | `grep -r "ADK_BUNDLE_URL\|run\.app" .next/static/` → absent (I run post-build) |
| N10 | Baseline fresh run BEFORE first change; full board after last (build + tsc + Jest) | — |

## 7. N7 DIAGNOSTIC procedure (launch amendment — the (a)/(b) fork)

Coordinator, live mode, `ADK_BUNDLE_URL` only:
1. Send a message in `/chat`, receive a real reply. Note the session id from
   localStorage `adk-session-map` (call it S).
2. **T0 probe (before reload):** `curl {ADK_BUNDLE_URL}/apps/{agent}/users/{user_id}/sessions/S`
   — the native GET, seconds after a successful run.
3. Hard-reload `/chat`. **T1:** the UI's own history fetch fires through the new route.

**Discrimination:**
- **(a) T0 returns the session WITH events** (your message + the model reply): the ADK
  store serves events natively → the wrapper's `/get_history` was the broken link —
  bug confirmed post-mortem, reload-history fixed for free, **N7 PASS** (T1 renders turns).
- **(b) T0 returns `events: []` / missing** despite the just-successful reply: the ADK
  session store itself is not persisting or serving events. **STOP AT THE FINDING** —
  report T0/T1 payloads verbatim, no cloud debugging; escalates to Architect/Coordinator.
- **Edge (b-variant):** T0 has events, T1 empty → events served immediately but not
  durable across time/instance (smells like instance-local session state on Cloud Run) —
  same STOP + report, labeled as the variant.

The fork is decided by **one number: `events.length` at T0** — before any reload, on the
native API, for a session that just produced a reply. That isolates store-behavior from
everything the frontend does.

## 8. Rollback confirmation

`git revert` of the BIM-002 commits restores the BIM-001 proxy internals; the wrapper
stays deployed and untouched until the Coordinator's post-close ceremony (N11); mock mode
remains one env flip away at every moment. Nothing in this module touches the cloud.

## 9. Commit plan (git is Coordinator's; zero git commands from me)

Suggested commits (one per concern):
1. `BIM-002: native ADK connector lib + fixtures + unit tests`
2. `BIM-002: port run/history route internals to native connector`
3. `BIM-002: retire ADK_WRAPPER_URL (env example + route tests)`
(Collapse to fewer if you prefer; file lists delivered at green board.)

**STOP — awaiting "plan approved."**
