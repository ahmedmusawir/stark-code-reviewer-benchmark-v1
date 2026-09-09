# CLAUDE.md — FIX-002 (QA Findings Triple-Fix) — FINAL

> **You are reading the manager file for FIX-002.** Read this FIRST. Status: **FINAL — stamped 2026-07-18**, authored from Stark Industries QA acceptance report (BIM-002, findings F01/F02/F03) + FIX-001/BIM-002 verified ground. This folder is **FROZEN from launch until you STOP** (Lesson L1 Rule 2).

---

## Mission (one sentence)

Fix the three UX defects Red Team QA found riding on the now-working native connector: restore the last selected agent after refresh (F01), show a visible loading state while history fetches (F02), and modernize the error sentinel's wording now that the wrapper is retired (F03).

## Provenance (why these three, together)

All three were logged in the BIM-002 acceptance report (2026-07-18, `agent_docs/QA/STARK_INDUSTRIES_QA.md`), severity Medium/Medium/Low, explicitly routed to this module by Architect adjudication. They share one surface region (the chat page + its store + one service string), so one module, three findings, three commits-worth of concerns.

## Verified ground (no re-verification needed)

- `useChatStore` persist layer works: key `adk-session-map`, `partialize` currently selects ONLY `{ agentSessions }` (F4 fence from FIX-001)
- Native history retrieval works and can take seconds (QA observed ~3s renders)
- The sentinel string "Error: Could not reach Agent Wrapper. Details: ..." lives in `chatService.ts` (frozen in prior modules; **deliberately unfrozen for F03 only** in this module)
- Green board entering: 25 suites / 174 tests, tsc clean, build clean

## TO VERIFY FIRST — your plan MUST open with these (file:line evidence)

1. Where `selectedAgent` state lives (chatStore? component state? `AgentSwitcher` wiring) and what sets it on mount
2. How `ChatPageContent` signals (or fails to signal) the history-fetch lifecycle — is there any existing loading state to reuse?
3. Every literal occurrence of the sentinel string (service + any test assertions that pin it)

## The three fixes

### F01 — Restore last selected agent (Medium)
Persist `selectedAgent` alongside the session map. Expected shape: extend the chatStore `persist` `partialize` to `{ agentSessions, selectedAgent }` (or wire selection into the store first if it currently lives in component state — plan proposes minimal diff). On mount: restored agent wins over the default; deep-link/explicit navigation (if any exists) wins over restored. **F4 fence holds: still no message content in localStorage** — the partialize test gets extended, not weakened.

### F02 — History loading state (Medium)
While the mount/agent-switch history fetch is in flight: render a lightweight "Loading conversation…" indicator in the transcript area (text or simple skeleton — match existing UI idiom; no new dependencies). On resolve: render history or the empty-state as today. On failure: existing degrade (empty) stands. No spinner on `sendMessage` (that flow has its own affordances) — scope is the HISTORY fetch only.

### F03 — Sentinel wording (Low)
The string becomes: `"Error: Could not reach Agent Service. Details: ..."` — chatService is unfrozen for THIS ONE STRING. Update every test that pins the old literal (they live in the sanctioned test zones). D1(b) semantics — resolve-not-throw, `session_id ?? ''` — unchanged. The BACKEND_SWAP_NOTES block gets its wording refreshed in the same touch if it still says "Wrapper."

## Forbidden zones

- Route handlers + `_lib/adk.ts` (BIM-002's work — frozen)
- `profileService` / `instructionsService` behavior (mocked; the merge precedence from FIX-001 stands untouched)
- `messagesByAgent` persistence — NEVER (F4)
- Types, pages outside the chat page, auth anything, kit noise
- QA-F04 (502-vs-empty for missing sessions) — explicitly OUT; deferred pending ADK-semantics verification per QA recommendation

## Gates

| # | Gate |
|---|---|
| X1 | Live: chat with jarvis_agent → hard refresh → **jarvis_agent is still selected** and its history renders (F01 + the FIX-001 pointer, together at last) |
| X2 | During the history fetch a loading indicator is visible; disappears on render (throttle network in DevTools to see it) |
| X3 | Bogus `ADK_BUNDLE_URL` → sentinel bubble reads "Agent Service", not "Wrapper" |
| X4 | localStorage still holds ONLY `{ agentSessions, selectedAgent }` under the map key — no message content (extended partialize test + manual inspect) |
| X5 | Mock mode: selection restore + loading state + sentinel all behave consistently; seeded demo flow intact |
| X6 | All pre-existing tests pass — modified ONLY where they pin the old sentinel literal or the old partialize shape (each such edit listed in your report) |
| X7 | Green board: build + `tsc --noEmit` + full Jest |

## Launch procedure

Plan Mode, ONE message: the three verifications with evidence · minimal-diff proposal per fix · exact list of test files needing literal updates (X6) · test plan mapped to X1–X7 · manual script for the Coordinator (X1/X2/X3/X4). STOP until "plan approved."

## Definition of done

Gates green · suggested commits one-per-finding (`FIX-002a/b/c:` or as ruled at plan review) · CHANGELOG + session log · `RETROSPECTIVE.md` here (sanctioned write) · **zero git, zero cloud — file lists and commit messages handed to the Coordinator** · STOP.

---

**Operator launch line:**
> *"Claudy — read `agent_docs/CURRENT_APP/FIX002/CLAUDE.md` and begin. Plan Mode."*

**Version 1.0-FINAL** · 2026-07-18 · Architect: Jarvis (Fable 5). Red Team found them; Blue Team fixes them. The wing works.
