# FIX-003 — Preflight Plan (PENDING_APPROVAL)

_2026-07-20 19:39 · Engineer: Claudy · Module: FIX-003 (Hydration Gate + Mode-Split
Persistence) · Branch `bim-005` (merged line: BIM-004 + BIM-005 present; combined
board 34/252 green)_

## The three verifications (file:line)

**V1 — persist wiring post-merge.** `src/store/chatStore.ts:160` `name:
"adk-session-map"` · `:164` `createJSONStorage(() => window.localStorage)` · `:168`
partialize `{agentSessions, selectedAgent}` · NO explicit `version` (zustand default
0) · no hydration flag anywhere. The BIM-004 reshape (sessionListByAgent etc.) is
in-memory only — unaffected by both fixes.

**V2 — zustand 4.5 hydration idiom (proposal).** 4.5 offers `onRehydrateStorage`
(persist option) and `store.persist.hasHydrated()` / `onFinishHydration`. With
synchronous localStorage, hydration completes at module load — so a store flag alone
is TRUE by first client paint while the SERVER rendered the default → an SSR
hydration mismatch (this mismatch IS part of the F06 flash). **Proposal — the
mismatch-safe two-pass gate:** store-level `_hasHydrated` set via
`onRehydrateStorage: () => (state) => state?.setHasHydrated(true)` (the brief's
store-level flag), consumed through a tiny `useHydrationReady()` hook:
`ready = hasHydrated && mounted` where `mounted` flips in a `useEffect`. Server
paint = loading idiom; first client paint = loading (MATCHES server, no mismatch);
one frame later = the restored agent. No greeting flash ever renders.

**V3 — gate targets in `ChatPageContent.tsx`.** Mount effect `:67-96` (reads
`selectedAgent` + pointers, fetches list+history) · agent/session-switch effect
`:98-…` (same reads; guarded by `hasMountedRef` which chains off the mount effect) ·
render body (agent title via children: MessageList/ChatInput read the store
directly). Plus the brief's third surface: `SessionPanel` (sidebar) reads
`selectedAgent`/lists — needs its own tiny gate (renders nothing until ready).
`AgentSwitcher` is NOT in the brief's suppress list — untouched (minimal diff).

## Fix proposals (minimal diffs)

**F09 — mode-namespaced key (the crown jewel):**
- `chatStore.ts`: `const PERSIST_MODE = process.env.NEXT_PUBLIC_CHAT_MODE === 'live'
  ? 'live' : 'mock'` (module-load resolution; same fail-safe default as the three
  services) → `name: \`adk-session-map-${PERSIST_MODE}\``.
- **Migration kindness** (module scope, before create, `typeof window` guarded): in
  LIVE mode only, if legacy `adk-session-map` exists AND `adk-session-map-live`
  doesn't → copy legacy → live key, `console.info` once, leave legacy in place
  (dead). Mock mode never adopts (mock pointers were the poison).
- Corrupt-value degrade path untouched (same persist plumbing).

**F06 — hydration gate:**
- `chatStore.ts`: `_hasHydrated: boolean` (init false, NEVER persisted — partialize
  unchanged) + `setHasHydrated` + `onRehydrateStorage` wiring.
- NEW tiny hook `useHydrationReady()` (lives in `chatStore.ts` — no new file needed):
  `mounted && _hasHydrated` two-pass as in V2.
- `ChatPageContent.tsx`: `const ready = useHydrationReady()`; render → if `!ready`
  return the FIX-002 loading idiom ("Loading conversation…" centered — reuse the
  exact visual); both effects get `if (!ready) return;` + `ready` in deps (mount
  effect keeps its mount-only semantics via `hasMountedRef` — it just starts one
  frame later).
- `SessionPanel.tsx`: `if (!useHydrationReady()) return null;` (panel appears with
  the rest — no flash of wrong-agent conversations).

## Files

MODIFY `src/store/chatStore.ts` (key + migration + flag + hook) ·
`src/app/(cyberize)/chat/ChatPageContent.tsx` (gate) ·
`src/components/chat/SessionPanel.tsx` (gate) ·
**sanctioned pre-existing test edits (H5 — key-rename class, every edit listed at
green board):** `chatStore.persist.test.ts` + `chatStore.sessions.test.ts` (the
`adk-session-map` literal → mode key; tests run flag-unset → `-mock`).
CREATE `src/__tests__/chat/chatStore.modeSplit.test.ts` — key per mode
(isolateModules + env), no cross-read (seed mock key, boot live → defaults),
adoption path (legacy → live copy, legacy intact, mock-boot never adopts), corrupt
degrade unchanged, `_hasHydrated` true post-load + never persisted.
CREATE `src/__tests__/chat/ChatPageContent.hydration.test.tsx` — with jarvis
pre-seeded: greeting content never appears, jarvis renders post-gate, history fetch
(if any) called for jarvis only; SessionPanel hidden pre-ready.
CREATE `agent_docs/CURRENT_APP/FIX003/ACCEPTANCE_SPEC.md` at green board (H6, incl.
the mode-flip walk that found F09).

**NOT touched:** routes + `_lib` (BIM-002/005) · services' signatures ·
sessionIndexService semantics · mocks' seeded data · AgentSwitcher · kit noise.

## Test plan → gates

H1 unit (no cross-read + both worlds intact) + manual flip walk · H2 unit (adoption)
+ manual legacy-key boot · H3 unit (no-greeting assertion) + manual throttled
refresh · H4 unit (partialize per namespace) + manual inspect · H5 fresh baseline
(entering 34/252) → full board, edits listed · H6 spec.

## Coordinator manual script (draft — final in spec)

1. **H3:** live, select Jarvis, chat, hard refresh (Slow-3G to see it) → loading →
   Jarvis; never a greeting_agent flash.
2. **H1:** flip to mock, chat with calc_agent → flip to live → calc gets a FRESH
   live flow (no mock session id in requests); flip back to mock → calc's mock
   thread intact. DevTools: `adk-session-map-live` + `adk-session-map-mock`, each
   pointers+selectedAgent only (**H4**).
3. **H2:** in DevTools, craft a legacy `adk-session-map` key (or use a pre-fix
   browser profile), remove the `-live` key, boot live → pointers adopted, legacy
   key still present but unused, console.info notes the adoption.

## Suggested commits

`FIX-003a: mode-namespaced persistence + legacy adoption (F09)` ·
`FIX-003b: hydration gate — no wrong-agent flash (F06)` ·
`FIX-003c: tests + acceptance spec + docs`

**STOP — awaiting "plan approved" + nods on: the two-pass mismatch-safe gate (V2),
mock-never-adopts, SessionPanel null-until-ready.**
