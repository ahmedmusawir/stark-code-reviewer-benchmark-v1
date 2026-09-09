# BIM-001 — STAGE B: MODULE BRIEF
## Backend Integration Module 001: "Prove the Wire" — Implementation Stage

> **Stark Industries App Factory — First Backend Integration Module**
> Status: **REVIEW** (awaiting Stage A recon reconciliation + Coordinator authorization)
> Authored by: Architect (Jarvis) — 2026-07-10 · **v1.1 restructure 2026-07-15:** now Stage B of the unified BIM-001 module at `agent_docs/CURRENT_APP/BIM001/`. Read `CLAUDE.md` in this folder FIRST; Stage B entry conditions live there. During Stage A this file is a CLAIM SOURCE only.
> Grounding: authored against live recon of the doc stack — frontend `src/types/index.ts`, `src/services/*`, wrapper `main.py`, wrapper `docs/api-info.md`, bundle `docs/architecture.md`. No guessing. Reconciled against live repo by Stage A: [PENDING — Architect stamps verdict here].

---

## 1. What a BIM Is (First-Use Definition)

A **Backend Integration Module** is the mirror image of an FFM. Where an FFM builds UI against a mocked service layer, a BIM replaces mock service bodies with real backend calls — **without touching a single component**. Same skeleton as an FFM: brief, contract amendment, forbidden zones, numbered hard gates, wave prompt, retrospective slot.

The FFM's success metric was: *"when the operator swaps the service layer to real backend, no component changes."*
The BIM's success metric is: **that swap, executed, with the promise kept.**

---

## 2. Hero Outcome

> Tony opens the Next.js chat UI, selects `jarvis_agent`, types a message, and gets a real response from the ADK bundle running on Google Cloud Run — round-tripped through the deployed Python wrapper, proxied through Next.js route handlers. Mock mode remains one env-var flip away.

---

## 3. Phase Context (Two-Cut Kill Plan)

| Phase | Name | What happens | Wrapper's fate |
|-------|------|--------------|----------------|
| **A (this BIM)** | Prove the Wire | Frontend → Next.js route handlers → **existing Python wrapper** → ADK bundle | Kept, untouched |
| B (BIM-002, future) | Kill the Wrapper | Port wrapper logic (session create/404-retry, event parsing, history normalization) into the route handlers → direct to ADK bundle | Retired |

**One variable per experiment.** Phase A changes only the frontend repo. The wrapper and ADK bundle are frozen — we do not redeploy, reconfigure, or even breathe on them.

### ⚠️ Explicit Phase Transition Declaration

The frontend repo's frontend-first doctrine (`stark-frontend-first` skill) forbids backend code and requires `/app/api` to stay starter-kit-only. **This BIM formally transitions the chat domain out of frontend-first phase.** Route handlers under `/app/api/agent/*` are now IN scope. This declaration exists so Claudy doesn't refuse the work on doctrine grounds — the doctrine is being lawfully superseded for this domain, not violated.

---

## 4. In Scope (P0 — all of it, nothing more)

1. **Two thin proxy route handlers** (server-side, App Router):
   - `POST /api/agent/run` → forwards verbatim to `{ADK_WRAPPER_URL}/run_agent`
   - `POST /api/agent/history` → forwards verbatim to `{ADK_WRAPPER_URL}/get_history`
2. **chatService live mode**: `sendMessage` and `getHistory` bodies call the internal route handlers. **Method signatures unchanged** — the existing contract tests must pass untouched.
3. **Mode flag**: `NEXT_PUBLIC_CHAT_MODE` = `mock` | `live`. Unset/anything-else → `mock`. Mock path preserved intact behind the flag.
4. **Server-side env**: `ADK_WRAPPER_URL` (NO `NEXT_PUBLIC_` prefix — never reaches the client bundle). `.env.example` updated.
5. **Error handling** per DATA_CONTRACT §1.5 (see Amendment doc §4).
6. **Tests**: route handler unit tests + live-mode chatService tests (wrapper mocked at fetch level). All existing tests stay green.

## 5. Out of Scope (say it loud)

- ❌ `profileService` (stays mocked — Supabase swap is its own future module)
- ❌ `instructionsService` (stays mocked — GCS swap is its own future module; open question F7 stays open)
- ❌ Any change to UI components, stores, pages, layouts, or types consumed by components
- ❌ Session create/retry logic in TypeScript (that's the wrapper's job in Phase A; ours in Phase B)
- ❌ Auth on the wire (wrapper is `--allow-unauthenticated`; BIM-002+ concern — but see §7 auth slot)
- ❌ Streaming responses
- ❌ Any change to the wrapper or ADK bundle repos/deployments
- ❌ Wrapper region migration (`us-east1` drift noted, deferred)

## 6. Hard Gates (numbered, measurable)

| # | Gate | Verification |
|---|------|--------------|
| G1 | Wrapper reachable | **Owned by Stage A** — health check captured in the Stage A recon report. Stage B re-verifies only if >48h have passed since the report (one `curl {ADK_WRAPPER_URL}/health`) |
| G2 | Contract intact | Existing `services.contract.test.ts` and `ChatPageContent.test.tsx` pass unmodified |
| G3 | Mock mode intact | `NEXT_PUBLIC_CHAT_MODE=mock` (or unset) → app behaves exactly as today |
| G4 | Live round-trip | `CHAT_MODE=live`: real message to `jarvis_agent` → real response renders in chat UI |
| G5 | Session continuity | Second message in same UI session reuses the `session_id` returned by the first |
| G6 | History loads | `getHistory` with the live session_id renders prior turns after reload |
| G7 | Falsy-session guard | `getHistory` with falsy session_id makes **zero** HTTP calls, returns `[]` (client-side guard per BACKEND_SWAP_NOTES) |
| G8 | Error sentinel | Wrapper unreachable in live mode → chat shows `"Error: Could not reach Agent Wrapper. Details: <e>"` as an assistant-style message; UI does not crash |
| G9 | No secrets in client | `ADK_WRAPPER_URL` absent from browser bundle (`grep` the `.next` build output) |
| G10 | Green board | `npm run build`, lint, and full test suite all pass |

## 7. Risks / Red Flags (carried from planning session)

- **Sentinel type nuance**: BACKEND_SWAP_NOTES specify error sentinel `session_id: undefined`, but `RunAgentResponse.session_id` is typed `string`. Claudy must surface this conflict in Plan Mode and propose a type-safe resolution (see Amendment §4). **Do not silently pick one** — doctrine.
- **Timeouts**: wrapper `run_agent` can take up to 60s internally; contract says 90s client budget. Route handler must not impose a shorter platform default (note `maxDuration` if the host is Vercel; Cloud Run is fine).
- **Auth slot reservation**: route handlers should pass through an optional `Authorization` header if present. Costs one line now, saves a re-architecture when security lands.
- **Both cloud services are public endpoints** — acknowledged, deferred, tracked. Do not let PoC success bury this.

## 8. Roles

| Role | Actor | This module's duty |
|------|-------|--------------------|
| Architect | Jarvis | This bundle. Binding verdict after Stage A. QA verdict on Claudy's Stage B plan. |
| Engineer | Claudy (Claude Code, Plan Mode) | Execute Stage B per `CLAUDE.md` entry conditions — plan first, build after approval |
| Coordinator | Tony | Rule D1 (sentinel) → authorize Stage B → relay plan for QA → approve execution → verify gates G4–G6 by hand (the fun part) |

## 9. Approval

- [ ] Stage A recon report reconciled; Architect verdict GO (or AMEND applied)
- [ ] Coordinator ruled D1 (sentinel conflict — Amendment §A1.4)
- [ ] Coordinator authorized Stage B in plain words
- [ ] Coordinator confirms hosting target for the frontend (affects timeout note only, not scope)

**Version:** 1.1 · **Changelog:** 1.0 initial authoring 2026-07-10 · 1.1 restructured as Stage B of unified BIM-001 module, G1 deduped to Stage A, entry conditions moved to CLAUDE.md (2026-07-15)
