# BIM-001 — STAGE A: RECON MISSION
## Assumption Validation + Baseline + Wrapper Health (rides on stark-recon v1.1)

> Read AFTER `CLAUDE.md` in this folder. This is the mission addendum for the stark-recon skill run. The skill is the engine (its doctrine, six phases, five labels, Output Contract all apply); this file adds the BIM-specific payload. Standing Operator rulings (git, network, install, paths) are in `CLAUDE.md` — not repeated here.

---

## A. Claim Source Under Test

`STAGE_B_MODULE_BRIEF.md` and `STAGE_B_DATA_CONTRACT_AMENDMENT.md` (this folder) were authored 2026-07-10 against a doc-stack snapshot. Factory doctrine: a module stage is not execution-ready until reconciled against the repo state that exists when the stage begins. Their statements are CLAIMs; the filesystem is evidence; disk wins; every drift gets both sides quoted.

## B. Assumption Checklist (one labeled finding each, in the report)

| ID | Stage B claims | Where to look |
|---|---|---|
| A1 | `src/services/chatService.ts` exports `sendMessage(RunAgentRequest) → Promise<RunAgentResponse>` and `getHistory(GetHistoryRequest) → Promise<Message[]>` | signatures, file:line |
| A2 | A `BACKEND_SWAP_NOTES` block exists in chatService prescribing direct wrapper calls, 90s/30s timeouts, falsy-session guard, error sentinel with `session_id: undefined` | quote the block |
| A3 | `src/types/index.ts` defines `RunAgentRequest`, `RunAgentResponse` (`session_id: string`), `GetHistoryRequest`, `Message {role, content}`, `AgentName` union (5 values), snake_case wire | file:line each |
| A4 | `src/app/api/` contains no agent routes (starter-kit/auth only) | listing |
| A5 | No `NEXT_PUBLIC_CHAT_MODE` (or equivalent mode flag) exists yet | grep |
| A6 | No `ADK_WRAPPER_URL` or live wrapper fetch exists yet in src | grep |
| A7 | Contract tests + chat component tests exist and are currently green | baseline run (§C) |
| A8 | `profileService` holds a one-session-per-agent map (`AgentSessionMap`); `instructionsService` is GCS-shaped; both mocked | file:line |
| A9 | Stage B's named forbidden-zone paths exist as named (`src/components/`, `src/store/`, `src/mocks/`, `src/services/index.ts`, the route group) | find; name drift = flagged drift |
| A10 | Build/lint/test scripts exist as Stage B gate G10 expects | package.json |
| A11 | Wrapper `/health` is live: 200 + agent list as documented | the one authorized GET |
| A12 | No uncommitted drift or surprise branches affecting the above | read-only git capture (per standing ruling 1) |

## C. Baseline (adds to the skill's standard build check)

1. Install deps (standing ruling 3)
2. Full test suite exactly as package.json defines → verbatim final summary block
3. Lint + build if scripts exist → verbatim summaries (the skill's route table comes free with build)
4. Failures = findings with IDs (B1, B2, …): verbatim error head + label + the words "logged, not fixed." Modifying tests to pass is forbidden.

## D. Wrapper Health (the single authorized network call)

`GET {ADK_WRAPPER_URL}/health` once (URL from Coordinator in-session) → status + body verbatim → compare agent list to Stage B docs → EVIDENCE or flagged drift. Unreachable = critical finding with exact error; max one retry.

## E. Recommended Verdict (closes the report's Recommendation-to-Architect section)

- **GO** — every load-bearing assumption A1–A11 holds; failures/drift, if any, don't touch Stage B's surfaces
- **AMEND** — Stage B viable; list named amendments (assumption → observed reality → required Stage B edit)
- **BLOCK** — specific blocker makes execution unsafe (wrapper down, contract tests red on baseline, forbidden zones missing as named); name blocker + exact unblock condition
Your verdict is *recommended*. The Architect's QA verdict is *binding*. The Coordinator authorizes Stage B. Everything found is logged, nothing is fixed.

## F. Outputs & Stop

Full report per skill Output Contract → `agent_docs/recon/RECON_adk-harness-frontend_BIM001-stageA_<YYYY-MM-DD>.md`. Pointer file → `agent_docs/CURRENT_APP/BIM001/STAGE_A_REPORT_POINTER.md` (3 lines: report path, date, recommended verdict). On-screen: one line + path + 3–5 line headline. Session log updated. **STOP — Stage B entry conditions live in CLAUDE.md and none of them are yours to grant.**

**Version 1.0** · 2026-07-15 · Formerly the BIM-000 Recon Addendum; restructured into Stage A of the unified BIM-001 module.
