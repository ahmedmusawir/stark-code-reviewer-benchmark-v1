# FIX-001 — Preflight Plan (PENDING_APPROVAL)

_2026-07-18 13:00 · Engineer: Claudy · Module: FIX-001 (Session Pointer Persistence)_

## The three verifications (TO VERIFY FIRST — with file:line)

**V1 — Where the map lives + how `ChatPageContent` gets the active session_id.**
The agent→session map lives in `useChatStore` as `agentSessions: AgentSessionMap`
(`src/store/chatStore.ts:26`; init `{}` at `:48`; mutated by `setAgentSessions` `:80` and
`setSession` `:81-84`). `ChatPageContent` reads the active session_id from the STORE in three
places (no component-local state holds it):
- Mount effect: `profileService.fetchProfile(userId)` → `setAgentSessions(sessions)` then
  `sessions[selectedAgent]` (`ChatPageContent.tsx:41-43`).
- Agent-switch effect: `useChatStore.getState().agentSessions[selectedAgent]` (`:70`).
- Send / regenerate: `useChatStore.getState().agentSessions[selectedAgent] ?? null`
  (`:91`, `:171`).
Both the store and the mock `profileService` are in-memory: `chatStore.ts:8` — "In-memory
only; reloads wipe"; `profileService.ts:20-23` returns `mockProfileStore[userId] ?? {}`;
`mocks/data/profiles.ts` — "Reloads wipe state."

**V2 — Shape.** `AgentSessionMap = Record<AgentName | string, string>`
(`src/types/index.ts:32`). `agentSessions` is exactly this type (`chatStore.ts:26`). Matches
BIM-000 A8. Confirmed.

**V3 — Existing store wraps it?** YES. `useChatStore` already holds `agentSessions` (next to
`messagesByAgent` = message content, and UI state). `persist` is already proven in-repo:
`useAuthStore` uses `persist` from `zustand/middleware` (`useAuthStore.ts:2,15,62-64`, name
`"auth-store"`). Zustand 4.5.4 → `persist` + `partialize` + `createJSONStorage` available.

## CRITICAL FINDING (surfaced, not silently handled)

**Persisting the store ALONE does NOT fix the bug.** On reload, even after persist restores
`agentSessions = {greeting_agent:"sess-xyz"}`, the mount effect calls
`profileService.fetchProfile(userId)` → (mock, wiped) `{}` → `setAgentSessions({})`, which is
a **blind replace** (`chatStore.ts:80`), overwriting the restored map; it then reads
`sessions[selectedAgent]` from the empty *fetched* map → `undefined` → no history. The G6 bug
survives.

→ **FIX-001 requires TWO coordinated changes:** (a) persist `agentSessions`; (b) reconcile
the mount effect so the fetched profile map does not clobber the restored pointer. Without
(b), (a) is inert.

## Design decision requiring the Architect's call

- **[RECOMMENDED] Persist-wrap `useChatStore` with `partialize`** selecting ONLY
  `{ agentSessions }`. Minimal diff; mirrors the proven `useAuthStore` pattern. Tradeoff:
  `partialize` is the sole guard keeping `messagesByAgent` out of localStorage (F4) — one
  future edit from a leak (guarded by an F4 unit test).
- **New micro-store `useSessionStore`** (only the map). Structurally makes F4 impossible to
  violate, but larger diff — rewire 5 `ChatPageContent` call sites + `setSession`/
  `setAgentSessions` + tests.

Brief guidance: "persist-wrap if possible; micro-store only if wrapping is ugly." Wrapping is
clean (partialize selects one field), so I recommend persist-wrap and flag the F4-safety
tradeoff.

## Minimal-diff proposal (RECOMMENDED path)

**MODIFY `src/store/chatStore.ts`:**
- Import `persist, createJSONStorage` from `zustand/middleware`.
- Wrap the store creator in `persist(...)`:
  - `name: "adk-session-map"`
  - `storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : undefined))`
    — SSR guard: server → no storage, degrades to in-memory, no crash.
  - `partialize: (state) => ({ agentSessions: state.agentSessions })` — persist ONLY the
    bookmark; `messagesByAgent` + UI state excluded (F4).
- Actions, `reset`, `INITIAL_STATE` unchanged.

**MODIFY `src/app/(cyberize)/chat/ChatPageContent.tsx` mount effect (~3 lines, `:41-43`):**
```ts
void profileService.fetchProfile(userId).then(async (fetched) => {
  const merged = { ...useChatStore.getState().agentSessions, ...fetched };
  setAgentSessions(merged);
  const sessionId = merged[selectedAgent];
  ...
```
Fetched wins per-key (server truth overrides when present); persisted fills gaps. Mock-seeded
user → fetched wins → identical to today. Empty fetched (real user / test) → restored pointer
survives → bug dead. No prop/signature/dep changes.

**CREATE `src/__tests__/chat/chatStore.persist.test.ts`** (F5):
- round-trip: `setSession` → localStorage `adk-session-map` holds the map.
- partialize: stored JSON has `agentSessions`, NOT `messagesByAgent` (F4).
- hydration: pre-seed localStorage → fresh store restores `agentSessions`.
- corrupt-value: malformed JSON → store degrades to `{}`, no throw.
- SSR guard: storage factory returns undefined when `window` absent.

## Test plan → gates
- F1 reload-live history returns → manual (Coordinator script).
- F2 incognito behaves as today → manual (Coordinator script).
- F3 mock byte-identical; existing tests unmodified → `ChatPageContent.test.tsx`,
  `AgentSwitcher.test.tsx`, `ChatInput.test.tsx` pass with zero edits + full suite.
- F4 no message content in localStorage → partialize unit assert + manual inspect.
- F5 round-trip / corrupt / SSR → new unit file.
- F6 green board → `npm run build` + `npx tsc --noEmit` + `npx jest`.

## Manual verification script for the Coordinator (F1/F2/F4)
1. `.env.local` `NEXT_PUBLIC_CHAT_MODE=live` (currently is); `npm run dev`; log in; open `/chat`.
2. Send a message to greeting_agent; wait for reply (session created).
3. **F1:** hard-reload → the conversation's history reloads (same session_id). Bug dead.
4. DevTools → Application → Local Storage → `adk-session-map` → **F4:** only the agent→session
   map, NO message text.
5. **F2:** incognito window → `/chat` → empty chat, new-session flow works, no stale sessions.

## Files I will NOT touch
- `chatService.ts`, `profileService.ts` — signatures + behavior frozen.
- `messagesByAgent` / message flow — never persisted.
- `useAuthStore.ts`, existing tests, mock data.

## Assumptions
1. Sync `localStorage` hydration completes before the mount `useEffect` runs (effects fire
   post-render; persist with sync storage hydrates at import) — merge reads the restored id.
   Confirm in F1 live walk.
2. `.env.local` stays `live` for F1 (currently is).
3. jsdom provides `window.localStorage`; persist active under Jest; existing tests pass
   because `reset()` in `beforeEach` controls state and hydration starts empty.

## Risks
- persist state bleeding across tests → mitigated by existing `reset()` + hydrate-once.
- `partialize` typo → message-content leak → F4 unit test guards it.
- If the Architect prefers structural F4 safety over minimal diff → micro-store variant.

## Definition of done
F1–F6 green · one commit `FIX-001: persist agent→session pointer to localStorage` (two only
if store + wiring split cleanly) · CHANGELOG + session log · `RETROSPECTIVE.md` in FIX001/ ·
STOP.
