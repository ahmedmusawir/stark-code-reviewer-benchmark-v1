# G6 Failure Investigation — chat history gone after reload

> Logged 2026-07-17 14:58 before on-screen display. Status: FINDINGS + OPTIONS —
> awaiting Coordinator/Architect ruling. No code touched.

## Verdict up front

**The wire I built is not broken — G6 is structurally unsatisfiable in BIM-001's scope.**
The live `session_id` has nowhere durable to live: its persistence is owned by
`profileService`, which the Brief explicitly keeps mocked (§5: "profileService stays
mocked — Supabase swap is its own future module"), and the mock is in-memory by design.

## The reload chain (all confirmed on disk)

1. During live chat, first response returns a real `session_id` →
   `ChatPageContent.tsx:114-118` stores it in the Zustand store and calls
   `profileService.saveProfile(...)`.
2. `saveProfile` (mock) writes to `mockProfileStore` — an **in-memory** map whose own
   docblock says "Reloads wipe state — acceptable for demo" (`src/mocks/data/profiles.ts:4-5`).
3. `chatStore` is also **in-memory only** — "reloads wipe. Cross-reload persistence
   deferred" (`src/store/chatStore.ts:8-10`, operator decision, session 2026-05-28).
4. On reload, the mount effect (`ChatPageContent.tsx:39-58`) calls
   `profileService.fetchProfile(userId)` → mock returns `{}` for real user IDs
   (only seed key is `'mock-user-001'`) → no `session_id` → `getHistory` is never
   called → empty chat. **Working as coded — in mock, live, FFM, and BIM-001 alike.**

Nothing BIM-001 shipped regressed this: reload persistence never existed in the FFM
either. G4/G5/G8/G3 passing proves the new wire works; G6 tests a persistence layer
that is two forbidden zones away (stores + profileService/Supabase).

## Why I'm not just fixing it (doctrine: surface, don't silently pick)

Every candidate fix violates the Brief:
- Persist `agentSessions` via zustand `persist` → **forbidden zone** (§5: no store
  changes). Also insufficient alone: the mount effect calls `setAgentSessions(sessions)`
  with the mock's `{}` on reload, clobbering anything rehydrated — fixing THAT means
  touching the component too (also forbidden).
- Back `mockProfileStore` with localStorage → touches out-of-scope `profileService`
  territory AND changes mock-mode behavior, straining G3's "exactly as today."
- Real Supabase `profileService` → explicitly a future module (§5).

## Options for ruling

| # | Option | Cost | Verdict fit |
|---|--------|------|-------------|
| **1 (recommended)** | **Amend G6 (AM-3):** prove the history *wire* directly — `curl -X POST localhost:3000/api/agent/history` with the live `session_id` from the G5 Network tab → wrapper returns prior turns as JSON. UI-reload persistence formally moves to the profile module (Supabase), where it lands for free via the existing mount effect — zero extra work there. | Zero code, one curl | One-variable-per-experiment preserved; scope lock intact |
| 2 | Mini-scope-extension: zustand `persist` on `agentSessions` + merge-don't-clobber in the mount effect | ~15 lines but **two forbidden zones opened**, new G3 regression surface | Needs Architect sign-off as a formal Brief amendment |
| 3 | localStorage-backed mock profile store | Small, but mutates FFM demo behavior + G3 gray zone | Weakest option |

**Recommended G6 verification (Option 1):**
```
curl -s -X POST http://localhost:3000/api/agent/history \
  -H 'Content-Type: application/json' \
  -d '{"agent_name":"jarvis_agent","user_id":"<your-user-id>","session_id":"<session-id-from-G5>"}'
```
Expected: `{"history":[{"role":"user",...},{"role":"assistant",...}]}` — prior turns
round-tripped through proxy → wrapper → ADK session store. That is the wire G6 exists
to prove; the pixels-after-reload half arrives with the profile module.

→ Awaiting ruling: amend G6 (Option 1), or authorize a scope extension (Option 2).
