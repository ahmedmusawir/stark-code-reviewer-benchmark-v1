# FIX-003 — ACCEPTANCE SPEC (for QA)

_2026-07-20 · Written for a QA team that has NOT read this module's internals._

## 1. What was built (plain language)

Two state bugs your team found are dead:

- **F06 (the wrong-agent flash):** on a hard refresh, the app used to briefly show
  greeting_agent (the default) before snapping to the agent you actually had
  selected. Now the chat area and the Conversations panel show the loading
  indicator until your saved selection is restored — the wrong agent never paints.
- **F09 (mode cross-contamination):** mock mode and live mode used to share ONE
  saved-state slot in the browser, so demo/mock session pointers could leak into
  live mode (and vice versa). Now each mode has its own slot:
  `adk-session-map-live` and `adk-session-map-mock`. Switching modes neither
  contaminates nor erases the other world.
- **Migration kindness:** a browser that used the app before this fix has the old
  shared slot (`adk-session-map`). On the first LIVE boot, its contents are adopted
  into the live slot automatically (one console note); the old slot is left in
  place, unused. Mock mode never adopts it — mock pointers were the poison.

Glossary: *hydration* = the moment saved browser state loads back into the app on
page load; *mock mode* = offline demo mode (`NEXT_PUBLIC_CHAT_MODE=mock`).

## 2. Setup

Normal live setup (as per BIM-003/004/005 specs). For the flash test, DevTools
Network throttling (Slow 3G) makes the loading window visible to the eye.

## 3. Expected behavior, per gate — try this

**H3 — no wrong-agent flash.** Live mode: select Jarvis, chat, hard-refresh
(Ctrl+Shift+R; throttle to Slow 3G to see it clearly). EXPECT: brief
"Loading conversation…" → Jarvis title, Jarvis thread, Jarvis conversations.
NEVER a flash of greeting_agent anywhere (chat area or sidebar panel).

**H1 — the mode-flip walk (the one that found F09).**
1. Mock mode: chat with calc_agent (mock reply).
2. Flip to live, restart: calc_agent starts a FRESH live flow — the first message
   creates a NEW live session (watch the request: no mock session id sent).
3. Flip back to mock, restart: calc_agent's mock thread is exactly where you left
   it. Neither world touched the other.

**H4 — storage inspect.** DevTools → Application → Local Storage. EXPECT at most:
`adk-session-map-live`, `adk-session-map-mock` (and possibly the dead legacy
`adk-session-map`). Each namespaced value holds ONLY agent→session pointers +
selectedAgent — zero message content (the long-standing fence, now per namespace).

**H2 — legacy adoption.** Simulate a pre-fix browser: in DevTools, create key
`adk-session-map` with a valid value (copy the shape from another key), delete
`adk-session-map-live`, boot in live mode. EXPECT: your pointers/selection are
back (adopted into `-live`), the legacy key still exists but is ignored, and the
console shows one info line about the adoption. Mock boot with only a legacy key
present: nothing adopted (fresh mock world).

## 4. Edge cases and what SHOULD happen

| Input | Expected |
|---|---|
| Corrupt value in either namespaced key | That mode boots with defaults; no crash (unchanged degrade) |
| Legacy key + existing live key both present | Live key wins; no adoption, no overwrite |
| Logout (store reset) | UI does not re-lock behind the loading gate |
| Fast connections | The loading frame may be imperceptible — that's success, not a skipped state |

## 5. Known limitations

- The dead legacy `adk-session-map` key is left in place forever (harmless;
  deliberate — we never delete user data in a migration). Manual cleanup is safe.
- The gate adds one extra loading frame on every chat-page mount (invisible on
  normal connections).
