# FIX-001 — RETROSPECTIVE — FINAL (module CLOSED 2026-07-18)

_Final disposition 16:14: **PASS**; reload-transcript display BLOCKED-UPSTREAM
(wrapper `/get_history` → `{"history":[]}` for a valid live session — latent v1
defect surfaced by FIX-001's success, never worked in system lifetime; wrapper
dies in BIM-002) → verification transfers to **BIM-002 gate N7**. Full ruling:
`agent_docs/RESPONSES/response_2026-07-18_161419_fix001-final-disposition.md`._

## What shipped

The agent→session pointer now survives reloads: `useChatStore` persist-wrapped
(key `adk-session-map`, `partialize` → `{agentSessions}` only) + the
`ChatPageContent` mount effect merges persisted ∪ fetched (fetched wins per-key)
instead of blind-replacing. 3 source files touched (2 modified, 1 new test file).
Green board: 24 suites / 149 tests, tsc clean, build clean.

## Field notes

1. **The two-part fix was the module's real content.** The brief's "TO VERIFY
   FIRST" discipline caught it before a line was written: persisting the store
   alone is inert because the mount effect's `setAgentSessions(fetched)` blind
   replace clobbers the hydrated map with the mock profile's `{}`. A
   persist-only implementation would have passed F5/F6 and still failed F1.
2. **jsdom cannot simulate a missing `window`** (`globalThis.window` is not
   spy-able → `_spyOnProperty` error). The SSR-guard test instead makes the
   `localStorage` getter throw — the identical path a server render takes into
   `createJSONStorage`'s catch. One red-green iteration, test-side only.
3. **L25 struck on schedule:** post-edit `tsc` showed 2 errors in
   `.next/dev/types/validator.ts` — stale dev artifacts. `rm -rf .next` →
   clean. The recon doctrine's "clear .next before tsc smoke" held.
4. **Zustand type note:** `createJSONStorage`'s getter must return
   `StateStorage` (not `| undefined`), so the SSR guard is "let the server
   throw, the middleware catches" — idiomatic and TS-clean — rather than a
   `typeof window` ternary. The build's 23/23 prerender is the live proof.

## Defect amendment (Architect-ruled, 2026-07-18)

The original mount-effect merge (`fetched wins per-key`) was wrong **while
profileService is mocked**: the mock returns SEEDED fake agentSessions, so
phantom ids overwrote the genuine persisted pointer on reload and `getHistory`
queried a nonexistent session → `[]` → chat evaporated. Flipped to
`{...fetched, ...persisted}` — persisted wins, fetched fills gaps.

**BIM-LADDER ITEM:** when profileService goes real (Supabase-backed), the merge
precedence in `ChatPageContent`'s mount effect MUST be revisited — with a real
server the fetched map becomes truth and should win again (or become the sole
source). Comment at the merge site marks this.

## Candidate lessons (proposed, not written)

- L-a: A persistence fix has two halves — storage AND every code path that
  rehydrates over it. Grep for writers of the persisted field before calling a
  persist-wrap "done."
- L-b: When jsdom can't simulate an environment condition, test the code path
  the condition produces (getter throws) rather than the condition itself
  (window absent).

## Final gate board (disposition 2026-07-18 16:14)

F1 **SPLIT** — pointer persistence + session reuse **PASS** (session-1784364468
identical across localStorage, /run, reload /history); transcript re-display
**BLOCKED-UPSTREAM** → **BIM-002 N7** · F2 ✅ · F3 ✅ · F4 ✅ (unit + manual) ·
F5 ✅ · F6 ✅ (24/149, tsc, build).

## Additional field note (from the live walk)

5. **FIX-001's success surfaced a latent v1 defect.** With the pointer finally
   surviving reload, the reload `/get_history` call fired with a valid session
   id for the first time in system history — and the wrapper returned
   `{"history":[]}`. Every prior architecture lost the pointer before this call
   could happen, so the broken retrieval path was unreachable and unobserved.
   Fixing one layer made the next layer's defect visible. Root cause
   deliberately not pursued: the wrapper is demolished in BIM-002, where gate
   N7 owns proving reload-transcript display end-to-end.

Zero git operations by Engineer across the whole module; commit is
Coordinator-owned (10-file stage list in
`agent_docs/RESPONSES/response_2026-07-18_145214_fix001-amendment-result.md` —
now 11 files with the disposition artifact).
