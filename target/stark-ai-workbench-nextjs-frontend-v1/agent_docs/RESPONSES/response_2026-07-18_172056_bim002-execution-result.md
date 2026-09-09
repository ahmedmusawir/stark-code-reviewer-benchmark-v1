# BIM-002 — Execution Result (Engineer side COMPLETE — green board)

_2026-07-18 17:20 · Engineer: Claudy · Module: BIM-002 (Native Connector — Kill the Wrapper)_
_Auto mode sections 3–6 per Coordinator authorization; FLAG-1 + FLAG-2 rulings applied._

## GREEN BOARD

- **Baseline (before first change):** 24 suites / 149 tests green · tsc clean.
- **After the port:** **25 suites / 174 tests green** (+1 suite `adk-lib.test.ts`, +25 net
  tests) · `tsc --noEmit` clean (fresh `.next`) · `npm run build` clean, both agent routes
  in the table.
- **N9 advisory pre-check:** `grep -rl "ADK_BUNDLE_URL|run.app" .next/static/` → zero hits
  (Coordinator formally confirms).
- **`ADK_WRAPPER_URL`:** zero references left in `src/` or `.env.example` (verified).

## CHANGES MADE

- **CREATE `src/app/api/agent/_lib/adk.ts`** — the connector: `runAgentFlow` (session
  bootstrap → run → not-found→create→retry-EXACTLY-once), `extractResponseText` (reversed
  scan, predicate `content.role === "model"` per FLAG-1), `normalizeHistory` (model→
  assistant, user→user, non-text skipped, malformed→`[]`), `isSessionNotFound` (404 or
  detail text), `newSessionId` (`session-${Date.now()}`, R4), `sessionUrl` (encoded
  segments), `ConnectorError` (status-carrying). One 90s deadline across the run path;
  per-call caps run ≤75s / create ≤10s, retry inherits the remainder. Auth forwarded
  verbatim on every native call (R2).
- **MODIFY `src/app/api/agent/run/route.ts`** — thin orchestrator over `runAgentFlow`.
  `POST` signature + `maxDuration = 90` frozen; 500 unset-env (now `ADK_BUNDLE_URL`),
  `ConnectorError` status or 502 on anything else. External shape `{response, session_id}`
  unchanged.
- **MODIFY `src/app/api/agent/history/route.ts`** — native GET → `normalizeHistory` →
  `{history}`; 30s timeout; 500/502 unchanged.
- **CREATE `src/__tests__/api/fixtures/adk-events.ts`** — the encoded oracle: happy path
  (canonical `author: "<agent_name>"`), multi-event last-model-text, `author: "model"`
  dual style (FLAG-1 mandatory), 404 not-found body, empty events, malformed events,
  mixed-turn history session + expected `Message[]`, empty-events session (the N7 shape,
  id `session-1784364468`).
- **CREATE `src/__tests__/api/adk-lib.test.ts`** — 18 unit tests: response selection
  (both styles, reversed scan, null-degrades), normalization (incl. N7 empty → `[]`),
  not-found predicate, R4 id format, URL encoding, and the flow: exact call sequences for
  bootstrap (N5), retry-once success + retry-failure 502 + no-retry-on-other-errors (N6),
  no-model-text 502, auth on create AND run.
- **REWRITE `src/__tests__/api/agent-run.test.ts` + `agent-history.test.ts`** (FLAG-2
  ruling) — native contract; every overlapping guarantee preserved: Authorization
  pass-through + omitted-when-absent · 500 + zero HTTP on unset env · 502 unreachable ·
  timeout signal present · frozen external shapes. New coverage: native payload shape,
  N5/N6 route-level flows, N7 empty-history shape, upstream non-OK → 502.
- **MODIFY `.env.example`** — R1: `ADK_BUNDLE_URL` in (structural placeholder
  `https://<bundle-service>-<project-number>.<region>.run.app`, AM-2), `ADK_WRAPPER_URL`
  out, section header now "ADK Bundle (BIM-002)".
- **MODIFY `jest.config.js`** — ⚠️ **ZONE DEVIATION, FLAGGED FOR RATIFICATION:** one
  addition to `testPathIgnorePatterns` (`src/__tests__/api/fixtures/`) so the data-only
  fixtures module isn't collected as an empty test suite (Jest fails suites with zero
  tests). `jest.config.js` is outside the Brief §4 enumerated writable files; the
  alternative (duplicating fixtures inside both test files) was worse. Reversible one-liner.

## THINGS I DIDN'T TOUCH

`chatService.ts` · `ChatPageContent.tsx` · all stores/components/types/pages ·
`profileService`/`instructionsService` · all tests outside `__tests__/api/**`
(byte-unmodified, N2) · the wrapper repo/cloud (untouched until the N11 ceremony) ·
kit noise (route-1.ts, auth-store `any`, lint B1).

## GATES

| Gate | Status |
|---|---|
| N1 | ✅ Ruled at plan review (history path disk-EVIDENCE; create/run CLAIM-with-provenance, no deviation) |
| N2 | ✅ Everything outside `__tests__/api` byte-unmodified and green |
| N3 | ✅ Service/component suites unchanged · Coordinator mock-flip spot-check pending |
| N4 | ⏳ **Coordinator manual** — `.env.local`: remove `ADK_WRAPPER_URL`, add real `ADK_BUNDLE_URL`, live message → real answer |
| N5 | ✅ Unit (call sequence) · virgin-chat manual pending |
| N6 | ✅ Unit (exactly-once retry / 502 / no-retry-on-other) · bogus-id self-heal manual pending |
| N7 | ✅ Unit (normalization + empty shape) · ⏳ **DIAGNOSTIC script** (plan §7): T0 native curl before reload decides (a) wrapper bug post-mortem / (b) ADK store fault → STOP+report |
| N8 | ✅ Unit (500/502) · bogus-URL sentinel manual pending |
| N9 | ⏳ Coordinator confirms (my advisory grep: clean) |
| N10 | ✅ Baseline 24/149 before · 25/174 + tsc + build after |
| N11 | Coordinator ceremony, post-close |

## FOR THE COORDINATOR — commits (git is yours; I ran zero git/cloud commands)

Per-concern commits as planned:

**Commit 1 — `BIM-002: native ADK connector lib + fixtures + unit tests`**
```
src/app/api/agent/_lib/adk.ts
src/__tests__/api/fixtures/adk-events.ts
src/__tests__/api/adk-lib.test.ts
jest.config.js
```

**Commit 2 — `BIM-002: port run/history route internals to native connector`**
```
src/app/api/agent/run/route.ts
src/app/api/agent/history/route.ts
```

**Commit 3 — `BIM-002: retire ADK_WRAPPER_URL (env example + route tests)`**
```
.env.example
src/__tests__/api/agent-run.test.ts
src/__tests__/api/agent-history.test.ts
```

**Docs (fold into commit 3 or a fourth `BIM-002: protocol docs`):**
```
agent_docs/RESPONSES/response_2026-07-18_163153_bim002-preflight-plan.md
agent_docs/RESPONSES/response_2026-07-18_172056_bim002-execution-result.md
session_2026-07-18.md
CHANGELOG.md
RECOVERY.md
```
(`BIM002/RETROSPECTIVE.md` lands at module close, after the manual gates.)

## MANUAL SCRIPT (N4 / N5 / N6 / N7-diagnostic / N8 / N3 / N9)

0. `.env.local`: delete `ADK_WRAPPER_URL`, add `ADK_BUNDLE_URL=<real bundle URL>`,
   keep `NEXT_PUBLIC_CHAT_MODE=live`. `npm run dev`, log in, `/chat`.
1. **N5:** incognito/fresh agent → first message works (virgin session created).
2. **N4:** real answer renders with only `ADK_BUNDLE_URL` set. Note session id S
   (localStorage `adk-session-map`).
3. **N7 DIAGNOSTIC:**
   - **T0 (before reload):** `curl {ADK_BUNDLE_URL}/apps/{agent}/users/{user_id}/sessions/S`
   - **(a)** events present (your msg + reply) → wrapper /get_history bug confirmed
     post-mortem; reload (T1) renders history → **N7 PASS**.
   - **(b)** `events: []` despite the fresh reply → ADK store not persisting/serving —
     **STOP**, capture T0/T1 payloads verbatim, hand to Architect. No cloud debugging.
   - **(b-variant)** T0 has events, T1 empty → served-but-not-durable; same STOP+report.
4. **N6:** edit localStorage `adk-session-map` to a bogus id (e.g. `session-1`), send →
   conversation self-heals into a new session.
5. **N8:** point `ADK_BUNDLE_URL` at a bogus host, restart, send → sentinel bubble
   ("Error: Could not reach Agent Wrapper…"), no crash. Restore URL.
6. **N3:** flip `NEXT_PUBLIC_CHAT_MODE=mock`, restart → seeded mock behavior identical.
   Flip back.
7. **N9:** `npm run build && grep -rl "ADK_BUNDLE_URL\|run\.app" .next/static/` → no hits.

## POTENTIAL CONCERNS

- The create/run endpoint paths remain runtime-proven only at N4/N5 (wrapper source
  absent from this repo — provenance flagged at plan). If the bundle 404s the create
  path, that's an N1-class finding: report, don't improvise.
- The jest.config.js one-liner needs ratification (zone deviation, flagged above).
- History `session_id` in the sentinel/guard path is unchanged — falsy-session guard
  still lives in chatService (untouched).
