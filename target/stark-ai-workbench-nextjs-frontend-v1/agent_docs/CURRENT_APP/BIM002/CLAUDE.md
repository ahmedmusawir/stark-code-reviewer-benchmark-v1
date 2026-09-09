# CLAUDE.md — BIM-002 (Native Connector — Kill the Wrapper) — FINAL

> **You are reading the manager file for BIM-002.** Read this FIRST. Status: **FINAL — stamped 2026-07-18**, authored from the BIM-002 pre-authoring recon (2026-07-17, post-merge main) + wrapper `main.py` evidence (§A1.6 port spec). This folder is **FROZEN from launch until you STOP** (Lesson L1 Rule 2).

---

## Mission (one sentence)

Port the Python wrapper's three jewels — session creation, the 404→create→retry-once loop, and event-array response parsing — into the two existing Next.js route handlers, in TypeScript, talking **directly** to the ADK bundle's native `api_server` API, so the wrapper can be retired with honors.

## The prize

After this module: UI → route handlers → **ADK bundle**. No middleman. Everything above the route internals — chatService, components, contract, sentinel, mock mode — **does not change**. That was the entire point of BIM-001's thin-proxy seam; today the seam pays out.

## Roles

Tony launches, rules the flagged decisions at plan review, approves, runs the manual pass, merges. Jarvis QAs the plan. You (Claudy) plan first, build after approval.

## Verified ground (recon 2026-07-17 — no re-verification needed)

- Port surface: **exactly two files** — `src/app/api/agent/run/route.ts` (48 ln) + `.../history/route.ts` (44 ln). `POST(req: Request)` signatures FROZEN.
- `chatService.ts` + `ChatPageContent.tsx`: DO NOT CHANGE (contract locked: snake_case wire, D1(b) sentinel, falsy-session `[]` guard).
- Green baseline to preserve: 23 suites / 144 tests, `tsc` exit 0, build clean (24 routes). Existing route tests (`agent-run.test.ts`, `agent-history.test.ts`) must stay green — extended, never weakened.
- Mock mode is the shipped fail-safe default and must survive untouched.
- Kit noise (orphan `route-1.ts`, `useAuthStore` any, lint bug B1): **logged elsewhere, NOT yours** — do not scope around them.

## Architect decisions (RULED — flag disagreement in your plan, don't silently deviate)

| # | Ruling |
|---|---|
| R1 (recon Q1) | `ADK_WRAPPER_URL` **retires with the wrapper**. New server-only env var: **`ADK_BUNDLE_URL`** — the ADK `api_server` base URL. `.env.example` updated (structural placeholder ONLY — AM-2 stands). Old var removed from example + code at close. |
| R2 (recon Q2) | Real auth **deferred again** (public endpoints remain a tracked risk). Preserve the `Authorization` pass-through slot verbatim in the new internals. |
| R3 (recon Q3) | Reload persistence is **FIX-001's job** — out of scope here. Chat domain only. |
| R4 | Session id scheme: **preserve the wrapper's `session-${Date.now()}`** convention this module (continuity; uuid migration is BIM-004 territory per plan D3). |
| R5 | Response parsing: reversed scan of the returned event array for the **last `model`-authored text part** — byte-equivalent behavior to the wrapper. History: map ADK events to the contract's `{role, content}[]` (author `model` → role `assistant`, user → `user`; skip non-text events), matching what the wrapper returned to the frontend today. |

## The port spec (from wrapper `main.py` — the oracle for its own replacement)

1. **Create session:** `POST {ADK_BUNDLE_URL}/apps/{agent_name}/users/{user_id}/sessions/{session_id}` (empty JSON body). Used when the run call reports an unknown session, and for null-session first messages (generate `session-${Date.now()}` first).
2. **Run:** `POST {ADK_BUNDLE_URL}/run` with `{ app_name, user_id, session_id, new_message: { role: "user", parts: [{ text: message }] } }` → returns an event array → parse per R5 → respond to the service in the LOCKED shape `{ response, session_id }`.
3. **Retry-once loop:** if run fails with the session-not-found signature (404 / "Session not found"), create the session, retry the run **exactly once**. Second failure → 502 `{ error }` (the service's sentinel handles the rest).
4. **History:** `GET {ADK_BUNDLE_URL}/apps/{agent_name}/users/{user_id}/sessions/{session_id}` → session's events → normalize per R5 → respond `{ history: [...] }` (service unwraps `.history`, unchanged).
5. **Error philosophy unchanged:** unset env → 500 `{error}`; upstream/parse failure → 502 `{error}`; timeouts 90s run-path total (including any create+retry), 30s history.
NOTE: your plan must verify these endpoint paths against the wrapper source / ADK docs in the repo doc stack and flag any deviation — the spec above is the Architect's port target from §A1.6 + wrapper evidence, and disk wins if they disagree.

## Suggested shape (plan may refine)

Shared internals in `src/app/api/agent/_lib/adk.ts` (create/run/parse/normalize + fixtures-friendly design); routes stay thin orchestrators. Test fixtures: realistic ADK event arrays (happy path, multi-event, session-not-found, empty/malformed) driving unit tests for parse/normalize/retry.

## Folder contents & reading order

1. `CLAUDE.md` (this) · 2. `MODULE_BRIEF.md` (scope, forbidden zones, gates N1–N10) · 3. `DATA_CONTRACT_AMENDMENT_A2.md` (connector contract; supersedes A1's internals-spec, inherits everything above the seam)

## Launch procedure

Plan Mode, ONE message: endpoint-path verification results (port-spec vs disk) · file list created/modified with rationales · fixture list · test plan mapped to gates · rollback confirmation · the Coordinator's manual conformance script (side-by-side old-wrapper vs native answers). STOP until "plan approved."

## Kill switch

Git revert of the BIM-002 commits restores the proxy internals (wrapper stays deployed and untouched until the Coordinator retires it AFTER gates pass). Plus mock mode, as always, one flip away.

## Definition of done

Gates N1–N10 green (Brief §6) · full regression green · one commit per concern (`BIM-002:` tagged) · CHANGELOG + session log · `RETROSPECTIVE.md` here (sanctioned write; flag lesson candidates for `agent_docs/LESSONS/`) · STOP. The wrapper's actual decommissioning (pausing the Cloud Run service) is a **Coordinator ceremony after close** — not yours.

---

**Operator launch line (AFTER FIX-001 closes):**
> *"Claudy — read `agent_docs/CURRENT_APP/BIM002/CLAUDE.md` and begin. Plan Mode."*

**Version 1.0-FINAL** · 2026-07-18 · Architect: Jarvis (Fable 5), overnight session.
