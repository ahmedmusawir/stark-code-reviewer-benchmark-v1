# BIM-001 — RETROSPECTIVE (Engineer) — FINAL

> Written by Claudy per manager Definition of Done — the one sanctioned Engineer write
> into this folder. Finalized 2026-07-17 on Coordinator close-out: **all gates G1–G10
> green** (G4/G5/G6/G8 spot + G3 both-direction flip verified by hand by the Coordinator,
> 2026-07-17). **BIM-001 is CLOSED.**

## What shipped

Two thin proxy routes (`/api/agent/run` 90s + `maxDuration=90`, `/api/agent/history` 30s),
chatService live mode behind `NEXT_PUBLIC_CHAT_MODE` (fail-safe mock default), D1(b)
sentinel, 23 new tests. Green board: 23 suites / 144 tests, tsc clean, build clean
(23 routes), G9 bundle-grep clean. Engineer commits `aa2ff05`, `ca8a915`, `4aee9ac`;
Coordinator's `c3e8598` sealed docs + live-test state. The FFM's promise held: **zero
component, store, page, or type changes** — the swap was invisible above the service layer.

## What fought back

1. **Plan-mode write lock vs Response Logging Protocol.** The harness's plan mode
   restricts writes to its own plan file; I treated that as an exemption and displayed
   the plan before logging it to `agent_docs/RESPONSES/`. The Operator caught it with
   the recovery cue. A mechanical write lock defers a protocol write — it never cancels it.
2. **G6's dependency chain crossed the module's own forbidden zones.** "History renders
   after reload" silently depended on `profileService` persistence (mocked by Brief §5,
   in-memory, reload-wiped) and a deliberately non-persistent chatStore. Structurally
   unsatisfiable as authored; surfaced with options instead of silently fixed
   (`response_2026-07-17_145856_g6-investigation.md`). Coordinator verified the intent
   of the gate live and ruled it green at close-out.
3. **Sentinel wording vs type, round two.** Even with D1 ruled, the wrapper response
   could omit `session_id` at runtime (types don't survive the wire). Resolved with one
   nullish chain — see field note 3 below. Worth folding into DATA_CONTRACT §1.5 wording
   in a future amendment so it's ruled, not inferred.

## Field notes from the live pass (Coordinator-reported)

1. **Hydration warning — false alarm.** A React hydration mismatch warning during live
   testing traced to the **Grammarly browser extension** injecting attributes into the
   DOM, not to our code. No action taken; none needed. Rule out extension noise (test in
   an incognito/clean profile) before debugging hydration warnings.
2. **First-run 500 from the sleeping backend — sentinel earned its keep.** The first
   live request hit a cold/sleeping Cloud Run wrapper and came back 500. The chat did
   not crash: the D1(b) sentinel rendered `"Error: Could not reach Agent Wrapper.
   Details: …"` as an assistant-style bubble, the session thread survived, and the
   retry succeeded once the instance warmed. G8's design was validated by accident
   before it was validated on purpose.
3. **Micro-decision, Architect-accepted:** live success path returns
   `session_id: data.session_id ?? input.session_id ?? ''` — a runtime guard protecting
   the `string` contract if the wrapper ever omits `session_id`. Same D1(b) spirit,
   zero type changes.

## What the recon bought

Zero exploratory dead-ends during the build. The seam was confirmed greenfield, the
Jest node-env route-test pattern was already proven by `superadmin-add-user.test.ts`,
and the D1/AM-1/AM-2 rulings meant zero mid-wave decision stalls. Every file landed
where Stage A said it would; the existing 121 tests never flickered.

## Candidate lessons for `agent_docs/LESSONS/` (proposed only — NOT written)

| Proposed filename | One-line thesis |
|---|---|
| `2026-07-17_L2_write-locks-defer-protocol-writes.md` | A mechanical write restriction (plan mode) defers a mandated protocol write; log the artifact the instant write tools return. |
| `2026-07-17_L3_gate-dependency-vs-forbidden-zones.md` | At authoring/QA time, trace each hard gate's dependency chain against the module's own forbidden zones — a gate that needs an out-of-scope layer is unsatisfiable as written (G6). |
| `2026-07-17_L4_wire-defaults-belong-in-contract.md` | Runtime defaults for wire fields (`response`, `session_id`) belong in the DATA_CONTRACT, not improvised in implementations — types don't survive the wire. |
| `2026-07-17_L5_rule-out-environment-noise-first.md` | Before debugging a browser-side anomaly, eliminate extension/environment interference (Grammarly hydration false alarm) and infrastructure cold starts (sleeping Cloud Run 500) — both mimicked app bugs. |

## Phase B pointer

The port target is exactly as recorded in Amendment §A1.6: wrapper's `create_session`,
the 404→create→retry-once loop, reversed-event parsing. Route handler signatures are
frozen; only their internals change. The live chatService tests double as the Phase B
regression harness — they mock at fetch level and never knew there was a wrapper.
