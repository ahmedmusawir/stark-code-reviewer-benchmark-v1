# CLAUDE.md — FIX-003 (Hydration Gate + Mode-Split Persistence) — FINAL

> **Manager file for FIX-003.** Read FIRST. Status: **FINAL — stamped 2026-07-20**, authored from the Stark QA FIX-002 Acceptance Report (findings QA-F06, QA-F09; both Architect-adjudicated). Folder **FROZEN from launch until STOP** (L1 R2). **GIT DOCTRINE: zero git commands.**

---

## Mission (one sentence)

Kill two state defects Red Team QA confirmed: the wrong-agent flash while persisted state hydrates (F06), and mock-mode session pointers poisoning live mode because both modes share one persisted namespace (F09).

## Fix 1 — F09: mode-namespaced persistence (the crown jewel)

- The chatStore persist key becomes **mode-dependent**: `adk-session-map-live` / `adk-session-map-mock` (mode = the existing `NEXT_PUBLIC_CHAT_MODE` resolution, same fail-safe default).
- Both worlds keep their own pointers + selectedAgent; switching modes never contaminates and never destroys the other world's state.
- **Migration kindness:** on live-mode boot, if the legacy `adk-session-map` key exists and the live key doesn't, adopt it (copy → live key), then leave the legacy key alone (dead). One-time, silent, logged to console.info.
- Unit tests: key selection per mode, no cross-read, adoption path, corrupt-value degrade unchanged.

## Fix 2 — F06: hydration gate

- Expose a store-level `hasHydrated` flag (zustand persist's `onRehydrateStorage`/`hasHydrated` idiom — verify the cleanest for zustand 4.5).
- Until hydrated: the chat page suppresses agent-specific rendering (agent title, thread, session panel) behind the existing loading idiom from FIX-002 — no flash of greeting_agent, no wrong-agent history fetch racing the restore.
- Mount effects that read `selectedAgent`/pointers wait for hydration (guard in deps/effect body — minimal diff).
- Test: pre-seeded storage with jarvis selected → first paint never shows greeting_agent content (assert render gating), then jarvis renders.

## Verified ground

FIX-002 green board (28/197 at its close; current lineage counts per latest merge) · persisted shape `{agentSessions, selectedAgent}` (QA X4 evidence) · loading-state idiom exists (FIX-002 F02) · mock/live flag resolution proven in three services.

## TO VERIFY FIRST (plan opens with these, file:line)

1. Current persist wiring in `chatStore.ts` post-BIM-004 (key name, partialize shape, version field)
2. The exact zustand 4.5 hydration-flag idiom available (`persist.hasHydrated()` vs `onRehydrateStorage` callback) — propose one
3. Every mount-effect consumer of `selectedAgent`/pointers in `ChatPageContent.tsx` that must gate on hydration

## Forbidden zones

Routes + `_lib` (BIM-002/005 work) · services' signatures · sessionIndexService semantics (BIM-004; the panel simply renders post-gate) · mocks' seeded data · types beyond what the flag needs · kit noise.

## Gates

| # | Gate |
|---|---|
| H1 | Mock → chat with an agent → flip live → that agent gets a FRESH live flow; the mock pointer survives untouched in its own key (flip back → mock world intact) — F09 dead |
| H2 | Legacy-key adoption: existing `adk-session-map` from before this fix boots live cleanly with pointers intact |
| H3 | Hard refresh with jarvis persisted → NO greeting flash; loading idiom → jarvis renders (throttle to see it) — F06 dead |
| H4 | localStorage inspect: two namespaced keys max, pointers + selectedAgent only (F4 fence per namespace) |
| H5 | Green board: build + tsc + full Jest; pre-existing edits only where the key rename/gate demands (each listed) |
| H6 | `ACCEPTANCE_SPEC.md` delivered (QA-readable, per-gate try-this, incl. the mode-flip walk that found F09) |

## Launch procedure

Plan Mode, ONE message: the three verifications · minimal-diff proposal per fix · test plan → gates · Coordinator manual script (H1/H2/H3/H4). STOP until "plan approved."

## Definition of done

Gates green · ACCEPTANCE_SPEC.md · per-concern commit suggestions · CHANGELOG + session log · RETROSPECTIVE.md · STOP.

---

**Operator launch line (branch per Coordinator's current git strategy):**
> *"Claudy — read `agent_docs/CURRENT_APP/FIX003/CLAUDE.md` and begin. Plan Mode."*

**Version 1.0-FINAL** · 2026-07-20 · Architect: Jarvis (Fable 5). Found by fucking with the product; fixed by respecting what was found.
