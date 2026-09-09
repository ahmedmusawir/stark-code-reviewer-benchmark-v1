# CLAUDE.md — FIX-001 (Session Pointer Persistence) — FINAL

> **You are reading the manager file for FIX-001.** Read this FIRST. Status: **FINAL — stamped 2026-07-18**, authored from BIM-000 recon (A8) + the BIM-002 pre-authoring recon (2026-07-17). This folder is **FROZEN from launch until you STOP** (Lesson L1 Rule 2).

---

## Mission (one sentence)

Make the frontend's agent→session pointer survive page reloads — so an existing chat's history returns after refresh — by persisting the session map to `localStorage` via Zustand persist middleware; **transcripts stay server-side, only the bookmark persists in the browser.**

## Why this module exists (the diagnosis, so you build the right thing)

The transcript store (Supabase, via ADK) works. What breaks on reload is the *pointer*: the agent→session map lives in mock/in-memory state, so a refresh wipes it, `getHistory` receives a falsy `session_id`, hits the (correct) G7 guard, and returns `[]`. The library is fine; we keep losing the card catalog. The fix persists the catalog card — nothing else.

## Hard doctrine

- **The frontend NEVER stores message content.** No transcripts, no message caching, **NO IndexedDB** (explicitly ruled out by the Architect — freight train for a lunchbox). Persist ONLY: agent name → session id (+ trivial metadata if already present in the map shape).
- Service signatures (`chatService`, `profileService`) do not change. Components' props do not change.
- Mock mode must behave exactly as today.

## Verified ground (no re-verification needed)

- `chatService` live/mock mechanics, D1(b) sentinel, falsy-session guard — recon 2026-07-17
- Sole non-test chatService consumer: `src/app/(cyberize)/chat/ChatPageContent.tsx` (1 getHistory + 3 sendMessage call sites)
- Zustand 4.5.4 (persist middleware available), Jest 30, green board 23/144 + tsc + build

## TO VERIFY FIRST — your plan MUST open with these three facts (with file:line)

1. Where the agent→session map currently lives and how `ChatPageContent` obtains the active `session_id` (profileService mock? store? component state?)
2. The exact shape of that map (`AgentSessionMap` per BIM-000 A8 — confirm current form)
3. Whether any existing Zustand store already wraps it (extend with `persist`) or a new tiny store is cleaner (create `useSessionStore`)
Your plan proposes the **minimal diff** based on what you find — persist-wrap existing state if possible; new micro-store only if the current wiring makes wrapping ugly.

## Design constraints

- Zustand `persist` → `localStorage`, storage key `adk-session-map`, SSR-safe (guard `window`; Next 16 + persist's default `createJSONStorage` handles this — verify hydration timing so the first `getHistory` fires with the restored id, not before)
- New chat / session replacement must still overwrite the map entry (existing behavior preserved)
- A corrupt/absent stored value degrades to today's behavior (empty map), never crashes

## Gates

| # | Gate |
|---|---|
| F1 | Reload mid-conversation (live mode) → same session id used; history renders (the bug is dead) |
| F2 | Fresh browser/incognito → app behaves as today (empty map, new session flow intact) |
| F3 | Mock mode byte-identical behavior; existing contract + component tests pass **unmodified** |
| F4 | No message content in localStorage — manual inspect: only the map under `adk-session-map` |
| F5 | Unit tests: persistence round-trip, corrupt-value degradation, SSR guard |
| F6 | Green board: build + `tsc --noEmit` + full Jest suite |

## Launch procedure

Plan Mode, one message: the three verifications with evidence · minimal-diff proposal (files created/modified) · test plan mapped to F1–F6 · manual verification script for the Coordinator (F1/F2/F4). STOP until "plan approved."

## Definition of done

Gates green · one commit (`FIX-001:` tagged; two only if store-creation and wiring genuinely separate) · CHANGELOG + session log · `RETROSPECTIVE.md` here (sanctioned write) · STOP.

---

**Operator launch line:**
> *"Claudy — read `agent_docs/CURRENT_APP/FIX001/CLAUDE.md` and begin. Plan Mode."*

**Version 1.0-FINAL** · 2026-07-18 · Architect: Jarvis (Fable 5), overnight session.
