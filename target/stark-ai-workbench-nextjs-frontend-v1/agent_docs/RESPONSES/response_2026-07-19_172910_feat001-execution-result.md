# FEAT-001 — Execution Result (Engineer side COMPLETE — green board)

_2026-07-19 17:29 · Engineer: Claudy · Module: FEAT-001 (Read-Aloud + Copy Everywhere)_
_Rulings applied with approval: code-skip = ANNOUNCE · input-copy = SKIP._

## GREEN BOARD

- **Baseline (fresh, before first change):** 26 suites / 180 tests green.
- **After:** **28 suites / 197 tests green** (+2 suites, +17 tests) · `tsc --noEmit`
  clean · `npm run build` clean (after one build-only fix, see field note below).
- **V8:** every pre-existing test byte-unmodified and green.

## CHANGES MADE

- **CREATE `src/utils/speech.ts`** — the v2 seed. `prepareSpeechText(markdown)`: fenced
  blocks (incl. unterminated trailing fences) → spoken "Code block skipped."; inline
  code → bare text; images → alt; `[label](url)` → "label (domain)"; bare URLs →
  domain; headings/blockquotes/lists/hr/emphasis/strikethrough stripped; table
  separator rows removed, pipes → pauses. `isSpeechSupported()` (SSR guard, existing
  idiom). **Single-owner engine:** `speak(text, onStateChange)` cancels any in-flight
  utterance AND notifies its owner before starting; `stopSpeaking()` cancels+notifies.
  v2 premium TTS swaps engines inside this file only — no env vars, no keys.
- **MODIFY `src/app/(cyberize)/chat/MessageActions.tsx`** — `ReadAloudButton` only:
  speaks `prepareSpeechText(content)` through the utility; speaking state driven by the
  utility's owner callback (starting message B reverts A's icon — the stale-state bug
  is dead); `useEffect` cleanup cancels own speech on unmount/navigation. Labels
  ("Read aloud"/"Stop reading") + disabled-when-unsupported preserved → the existing
  `MessageActions.test.tsx` passes byte-unmodified. Copy/Feedback/Regenerate/Edit
  untouched.
- **CREATE `src/__tests__/utils/speech.test.ts`** — 13 tests: prepareSpeechText table
  (markdown stripped, code announced+omitted, truncated fence, inline code, links →
  domain, tables flattened, list markers) + engine (start/notify, cancel-previous with
  owner notification, stop, utterance-end, unsupported no-throw).
- **CREATE `src/__tests__/chat/MessageActions.readaloud.test.tsx`** — 4 tests: speaks
  CLEANED text; toggle stop reverts label; two bubbles → B cancels A, exactly one
  "Stop reading" remains (B's); unmount cancels.

## DRIFT RECORDED (for the retrospective)

Scope 2 (message copy), Scope 3 (code-block copy), and a basic read-aloud were ALREADY
on disk despite the brief's "decorative" premise — flagged at plan, module executed as
the shrunk scope (read-aloud quality + utility isolation). Scope 4 (input copy) ruled
SKIP: native textarea selection suffices.

## FIELD NOTE — the build-only failure (retrospective candidate)

First build FAILED with tsc and Jest both green: **Tailwind's content scanner** lifted
the regex character class `[-:|\s]` out of `speech.ts` source text as an
arbitrary-property class candidate and emitted invalid CSS (`.\[-\:\|\\s\] { -: |\s; }`).
Fix: the one regex rewritten as alternation `(?:\||-|:|\s)+` — semantics identical,
no bracketed prop:value-shaped token in source. Lesson: in a Tailwind-scanned repo,
bracket-with-colon character classes in ANY source file are build hazards invisible to
tsc and Jest.

## GATES

| Gate | Status |
|---|---|
| V1 | ✅ unit (toggle, cross-bubble cancel, unmount) · ⏳ manual 1-2 |
| V2 | ✅ unit (no markdown symbols, code skipped+announced) · ⏳ manual 1 |
| V3 | ✅ EXISTING (CopyButton + pinned test) · ⏳ manual 3 |
| V4 | ✅ EXISTING (CopyCodeButton) · ⏳ manual 4 |
| V5 | ✅ Ruled SKIP at plan review |
| V6 | ✅ pure frontend, suites green · ⏳ manual 6 (mock flip) |
| V7 | ✅ SSR guards + build clean |
| V8 | ✅ baseline 26/180 → 28/197; existing tests byte-unmodified |

## FOR THE COORDINATOR — commits (zero git/cloud from me)

**`FEAT-001a: speech utility — clean text + single-owner engine (v2 seed)`**
```
src/utils/speech.ts
src/__tests__/utils/speech.test.ts
```
**`FEAT-001b: wire read-aloud through the speech utility`**
```
src/app/(cyberize)/chat/MessageActions.tsx
src/__tests__/chat/MessageActions.readaloud.test.tsx
```
**Docs (with 001b or separate):**
```
agent_docs/RESPONSES/response_2026-07-19_171925_feat001-preflight-plan.md
agent_docs/RESPONSES/response_2026-07-19_172910_feat001-execution-result.md
session_2026-07-19.md
CHANGELOG.md
RECOVERY.md
```
(`FEAT001/RETROSPECTIVE.md` — with the v2-TTS seed notes — lands at module close.)
Note: FEAT-001 files have ZERO overlap with the uncommitted FIX-002 files — stage
independently in any order.

## MANUAL SCRIPT (V1/V2/V3/V4/V6)

1. Live mode, `/chat`: ask an agent for "a short explanation with a code example" →
   speaker reads the prose, says "Code block skipped.", never says "asterisk".
2. Click speaker on a second message mid-speech → first stops (icon reverts), second
   plays. Click the active speaker → stops.
3. Copy the message → paste → full markdown text present.
4. Copy the code block → paste → raw code only.
5. Reload → everything still wired. Navigate away mid-speech → audio stops.
6. Flip to mock → all identical. Flip back.
