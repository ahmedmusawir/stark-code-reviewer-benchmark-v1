# BIM-002 — MODULE BRIEF — FINAL
## Native Connector: the Wrapper's Brains, Ported Home

> Status: **FINAL — stamped 2026-07-18** · Architect: Jarvis · Grounding: BIM-002 pre-authoring recon (2026-07-17) — zero merge drift, port surface verified, green baseline 23/144. Read `CLAUDE.md` in this folder FIRST (rulings R1–R5 + port spec live there).

---

## 1. Hero outcome

Tony pauses the Python wrapper's Cloud Run service, sends a message from the Next.js UI, and gets a real ADK answer anyway — because the frontend no longer needs the middleman. Same UI, same contract, one less service in the chain.

## 2. In scope (P0, nothing more)

1. Rewrite the internals of the two agent route handlers to speak native ADK `api_server` protocol per the port spec (manager §port-spec, rulings R1–R5)
2. Shared connector internals module (suggested `src/app/api/agent/_lib/adk.ts`): create-session, run+retry-once, event parsing, history normalization — fixture-testable pure functions where possible
3. Env migration: `ADK_BUNDLE_URL` in (server-only, placeholder in `.env.example`), `ADK_WRAPPER_URL` out (code + example)
4. Tests: extend the two route test files for the ported logic; new unit tests for parse/normalize/retry against realistic ADK event fixtures
5. Protocol docs: CHANGELOG, session log, retrospective

## 3. Out of scope (say it loud)

- ❌ `chatService.ts`, `ChatPageContent.tsx`, any component/store/page/type — the seam holds
- ❌ `profileService` / `instructionsService` (mocked; FIX-001 owns the pointer, BIM-003+ owns the rest)
- ❌ Auth (R2: deferred; pass-through slot preserved verbatim)
- ❌ Streaming, session-id scheme changes (R4), retention, Memory Bank
- ❌ The wrapper repo, the ADK bundle repo, ANY cloud change — the wrapper stays deployed untouched until the Coordinator's post-close ceremony
- ❌ Kit noise from the recon (orphan route-1.ts, auth-store `any`, lint bug) — logged, not yours

## 4. Forbidden zones (hard stops)

Everything under `src/` EXCEPT: `src/app/api/agent/**` (the two routes + new `_lib`) and `src/__tests__/api/**` (+ new fixture/test files). Existing tests outside that path must pass **unmodified**. `.env.example` and protocol docs are the only other writable files. The BIM002 module folder is frozen except `RETROSPECTIVE.md` at close.

## 5. Conformance doctrine (the module's soul)

The wrapper is the **oracle for its own replacement**: for the same inputs, the native connector must produce equivalent outputs — same response text selection, same session behavior, same history shape, same error surface at the service boundary. Fixtures encode the oracle for units; the Coordinator's side-by-side script proves it live.

## 6. Hard gates

| # | Gate | Verification |
|---|------|--------------|
| N1 | Endpoint truth | Plan verified port-spec paths against wrapper source/ADK docs on disk; deviations flagged and ruled before build |
| N2 | Contract intact | All existing tests pass unmodified (incl. contract + component + BIM-001 route tests where behavior overlaps) |
| N3 | Mock intact | `CHAT_MODE=mock` byte-identical behavior |
| N4 | Live round-trip, no wrapper | `.env.local` carries ONLY `ADK_BUNDLE_URL`; real message → real answer renders |
| N5 | Fresh-session flow | Null/absent session id → connector generates `session-${Date.now()}`, creates, runs — first message works in a virgin chat |
| N6 | Retry-once proof | Unit: session-not-found fixture → exactly one create + one retry, then success; second-failure path → 502. Manual: delete/expire a session server-side (or use a bogus stored id), send → conversation self-heals into a new session |
| N7 | History parity | Reload mid-chat → prior turns render identically to wrapper-era behavior (roles mapped, non-text events skipped) |
| N8 | Error surface | Bundle unreachable → 502 → service sentinel bubble; env unset → 500; UI never crashes |
| N9 | No secrets/URLs in client | Built bundle grep: `ADK_BUNDLE_URL` and `run.app` absent from `.next/static/` |
| N10 | Green board | build + `tsc --noEmit` + full Jest (144+) — baseline before first change, proof after last |
| N11 | **The ceremony gate** | With all above green: Coordinator pauses the wrapper's Cloud Run service → sends one more message → everything still works → wrapper formally retired with honors (Coordinator action, post-close) |

## 7. Risks

- **Endpoint drift** between the port spec and actual ADK `api_server` routes — that's why N1 is gate one; disk wins.
- **Event-shape assumptions** — the fixtures must come from real wrapper-era shapes (doc stack has captured examples); malformed-event handling degrades to 502, never a crash.
- **Timeout arithmetic** — create+run+retry must fit the 90s budget; the plan states the internal budget split.
- Public endpoints remain public (tracked, deferred, R2).

## 8. Approval

- [x] Recon reconciled (2026-07-17, this brief authored from it)
- [x] Architect rulings R1–R5 recorded (manager file)
- [ ] Coordinator confirms rulings at plan review (esp. R1 env rename)
- [ ] Coordinator: "plan approved" after Architect QA

**Version 1.0-FINAL** · 2026-07-18
