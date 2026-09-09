# FIX-002 — Preflight Plan (PENDING_APPROVAL)

_2026-07-19 14:00 · Engineer: Claudy · Module: FIX-002 (QA Findings Triple-Fix: F01/F02/F03)_

## The three verifications (TO VERIFY FIRST — file:line evidence)

**V1 — Where `selectedAgent` lives + what sets it on mount.**
It lives in `useChatStore` (`src/store/chatStore.ts:25`, initial `DEFAULT_AGENT =
"greeting_agent"` at `:19,:48`) and is set ONLY by `AgentSwitcher.tsx:23` on user click.
**Nothing sets it on mount** — the default wins every reload; that IS F01. It is NOT in
the persist `partialize` (FIX-001 selected only `{agentSessions}`). No deep-link/URL
mechanism exists (`AgentSwitcher.tsx:37` only checks `pathname.startsWith("/chat")`), so
"deep-link wins over restored" has no code path to arbitrate — noted, nothing to build.
Zustand persist hydrates synchronously before effects, so a restored value automatically
wins over the default and the mount effect's history fetch reads the restored agent.

**V2 — History-fetch lifecycle signaling.**
None exists. The store's `isLoading` (`chatStore.ts:27`) is set ONLY by the sendMessage/
regenerate flows (`ChatPageContent.tsx:98,181` era) and renders ThinkingDots
(`MessageList.tsx:90-96`). The two history fetches — mount effect
(`ChatPageContent.tsx:38-68`) and agent-switch effect (`:70-92`) — set no state, so
while history is in flight `MessageList.tsx:33-52` renders the EMPTY-STATE ("Send a
message to start the conversation") — the misleading ~3s QA observed. Reusable idiom:
MessageList already branches on store flags; the fix follows the exact same pattern.

**V3 — Sentinel literal occurrences (exactly 4).**
- `src/services/chatService.ts:57` — the live string (the F03 target)
- `src/services/chatService.ts:116` — BACKEND_SWAP_NOTES comment (refresh in same touch,
  sanctioned; the block's table/wording still says "Wrapper")
- `src/__tests__/services/chatService.live.test.ts:105` (regex pin) and `:132` (literal pin)
No other `"Could not reach Agent"` occurrences in src (grep-verified).

## Minimal-diff proposal per fix

**F01 — restore last selected agent** (2 small edits + test extension):
- `src/store/chatStore.ts`: `partialize: (s) => ({ agentSessions: s.agentSessions,
  selectedAgent: s.selectedAgent })`. Nothing else — hydration order does the rest.
  (`lastSelectedAgent`, messages, flags: NOT persisted.)
- `src/__tests__/chat/chatStore.persist.test.ts`: update the exact-shape F4 pin (allowed
  by X6: "old partialize shape") + NEW cases: selectedAgent round-trip, hydration
  restores agent, corrupt still degrades.

**F02 — history loading state** (store flag + two effect wraps + one render branch):
- `chatStore.ts`: add `isHistoryLoading: boolean` (init false, NOT persisted) +
  `setHistoryLoading(loading)`.
- `ChatPageContent.tsx`: set true immediately before each `chatService.getHistory` call
  (mount effect + agent-switch effect), false when the fetch settles (both are already
  `.then`-chained; failure path already degrades to `[]` — flag clears in the same
  settle). No-fetch paths (no session id / already-loaded) never touch the flag.
- `MessageList.tsx`: when `isHistoryLoading`: render a lightweight
  "Loading conversation…" line (text + the existing pulse idiom, no new deps) in the
  transcript area and suppress the empty-state branch (`:33` gains
  `&& !isHistoryLoading`). sendMessage's ThinkingDots untouched.
- NEW test file `src/__tests__/chat/MessageList.loading.test.tsx`: isHistoryLoading →
  indicator visible + empty-state suppressed; false → today's branches.

**F03 — sentinel wording** (one string + sanctioned comment + 2 test pins):
- `chatService.ts:57`: `"Error: Could not reach Agent Service. Details: ${e}"`.
  D1(b) semantics (resolve-not-throw, `session_id ?? ''`) byte-unchanged.
- `chatService.ts` BACKEND_SWAP_NOTES block: "Wrapper" wording refreshed (same touch,
  sanctioned by the brief).
- `chatService.live.test.ts:105,132`: literals updated to "Agent Service".

## X6 — exact list of pre-existing test files needing edits
1. `src/__tests__/services/chatService.live.test.ts` — 2 sentinel literal pins (F03).
2. `src/__tests__/chat/chatStore.persist.test.ts` — the exact-shape partialize pin (F01)
   + extensions.
Nothing else. `ChatPageContent.test.tsx` is untouched: it mocks `fetchProfile → {}` (no
session → no history fetch → flag never set) and asserts nothing about the empty-state.

## Test plan → gates
- X1 manual (script) · X2 manual + new MessageList loading test · X3 manual + updated
  live-test literals · X4 extended partialize test + manual inspect · X5 manual mock
  flip (mock path never sets the flag differently — same code path) · X6 the two files
  above, each edit listed in the report · X7 build + tsc + full Jest (baseline fresh
  before first change; board entering: 25/174).

## Manual script for the Coordinator (X1/X2/X3/X4 + X5)
1. Live mode (`ADK_BUNDLE_URL` real, `NEXT_PUBLIC_CHAT_MODE=live`), `npm run dev`, log
   in, `/chat`. Switch to jarvis_agent, send a message, get a reply.
2. **X1:** hard refresh → **jarvis_agent still selected** and its history renders.
3. **X2:** DevTools → Network → throttle (Slow 3G) → refresh → "Loading conversation…"
   visible in the transcript area until history renders, then disappears.
4. **X4:** DevTools → Local Storage → `adk-session-map` → value holds ONLY
   `{agentSessions, selectedAgent}` — zero message content.
5. **X3:** point `ADK_BUNDLE_URL` at a bogus host, restart, send → error bubble reads
   "Error: Could not reach Agent **Service**. Details: …". Restore URL.
6. **X5:** flip `NEXT_PUBLIC_CHAT_MODE=mock`, restart → seeded flow intact; selection
   restore + loading behavior consistent. Flip back.

## Forbidden zones honored
Route handlers + `_lib/adk.ts` frozen · profileService/instructionsService untouched
(FIX-001 merge precedence stands) · `messagesByAgent` NEVER persisted (X4 fence
extended, not weakened) · F04 explicitly OUT (deferred, ADK semantics).

## Suggested commits (one per finding; zero git from me)
- `FIX-002a: persist selected agent across reloads`
- `FIX-002b: history-fetch loading state in transcript area`
- `FIX-002c: sentinel reads Agent Service (wrapper retired)`

**STOP — awaiting "plan approved."**
