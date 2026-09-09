# FEAT-001 — Preflight Plan (PENDING_APPROVAL)

_2026-07-19 17:19 · Engineer: Claudy · Module: FEAT-001 (Read-Aloud + Copy Everywhere)_
_Launch condition satisfied: BIM-002 closed + N11 done. FIX-002 manual pass running in
parallel — zero file overlap (verified below)._

## ⚠️ DOC-VS-DISK DRIFT (flagged first — disk wins)

The brief's premise — *"speaker and copy icons … are currently decorative"* — is FALSE
on disk. Evidence:
- **Message copy (Scope 2): ALREADY BUILT.** `MessageActions.tsx:116-136` `CopyButton` —
  `navigator.clipboard.writeText` + 2s check flash. Pinned by
  `MessageActions.test.tsx:101-122`.
- **Code-block copy (Scope 3): ALREADY BUILT.** `MessageBubble.tsx:173-196`
  `CopyCodeButton` — top-right on every fenced block, copies raw code, same flash.
- **Read-aloud (Scope 1): EXISTS BUT DEFICIENT** — see V-findings below. This is the
  module's real work.
- Bonus already present: whole-conversation copy (`MessageList.tsx:124-159`).

The module therefore shrinks to: **read-aloud quality + the v2-seed speech utility +
the input-copy ruling.** Scope 2/3 become verify-and-gate, not build.

## The four verifications (file:line)

**V-1 — Action icons + handlers.** `MessageActions.tsx` renders the bar
(assistant: Copy/Read Aloud/👍/👎/Regenerate-if-last; user: Copy/Edit). Copy is fully
wired (:116-136). Read-aloud (:138-166) is wired but deficient against the gates:
  - speaks RAW markdown — `new SpeechSynthesisUtterance(content)` at `:150` → will read
    "asterisk asterisk" and full URLs → **V2 FAIL as-is**;
  - code blocks are spoken → **V2 FAIL as-is**;
  - `speechSynthesis.speak()` QUEUES (`:153`) — starting message B while A speaks does
    not cancel A, and A's local `speaking` state goes stale → **V1 FAIL as-is**;
  - no cancel on unmount/navigation (`:139-155` — no effect cleanup) → speech continues
    after leaving the page;
  - engine calls are inline in the component — no v2-seed isolation.
Thumbs stay decorative-with-callback (out of scope, untouched).

**V-2 — Markdown/code rendering.** `react-markdown` + `remarkGfm` with a custom
`components.code` override (`MessageBubble.tsx:69-168`); fenced blocks render via
`SyntaxHighlighter` inside a `relative` wrapper that ALREADY hosts `CopyCodeButton`
(`:79-97`). Nothing to hook — Scope 3 is done.

**V-3 — Chat input.** `ChatInput.tsx` — plain `<textarea>` (`:90-99`), no copy
affordance. **Ruling proposal: SKIP** (Scope 4 sanctions this): the draft is
user-authored text sitting in a native textarea — OS-native select-all+copy works
everywhere including mobile long-press; the edit flow already prefills drafts; a
dedicated button would add chrome to the tightest surface in the UI for the rarest copy
target. If overridden: a small `ClipboardCopy` button beside the send button, visible
only when the draft is non-empty (~15 lines, same flash idiom).

**V-4 — SSR guard pattern.** Existing idiom on disk:
`typeof window !== "undefined" && "speechSynthesis" in window`
(`MessageActions.tsx:140-141`). The utility adopts exactly this (module functions
no-op/return false server-side); `navigator.clipboard` already guarded by try/catch
everywhere it's used. Build is the V7 proof.

## Code-skip announcement proposal (Scope 1 — plan decides)

**ANNOUNCE, don't silently omit:** each fenced block becomes the spoken phrase
"Code block skipped." — the Coordinator is audio-first; silent omission mid-explanation
makes prose that references the code ("as shown below…") incoherent. Inline code is
spoken as its literal text (usually short identifiers), backticks stripped.

## Files (created / modified, with rationales)

| File | Action | Why |
|---|---|---|
| `src/utils/speech.ts` | CREATE | The v2 seed: `prepareSpeechText(markdown)` (strip **/*/_/#/>/table pipes; fenced blocks → "Code block skipped."; inline code → bare text; links/URLs → "label (domain)"), `isSpeechSupported()`, `speak(text, onStateChange)` + `stopSpeaking()` — single-owner engine: a new `speak` cancels the previous and notifies its owner (stale-state fix). v2 swaps the engine INSIDE this file only; no env vars, no keys. |
| `src/app/(cyberize)/chat/MessageActions.tsx` | MODIFY (ReadAloudButton only) | Speak `prepareSpeechText(content)` via the utility; speaking state driven by the utility's owner callback (cross-message cancel correct); `useEffect` cleanup cancels own speech on unmount. Labels "Read aloud"/"Stop reading" and disabled-when-unsupported preserved → existing test green unmodified. CopyButton/Feedback/ActionButton untouched. |
| `src/__tests__/utils/speech.test.ts` | CREATE | prepareSpeechText table: bold/italic/heading/blockquote stripped; fenced block → announcement, code text absent; inline code bare; `[label](url)` → "label (domain)"; bare URL → domain. Engine (mocked `speechSynthesis`): speak→cancel-previous+notify, stop, unsupported no-throw. |
| `src/__tests__/chat/MessageActions.readaloud.test.tsx` | CREATE | Interaction: click → `speak` called with CLEANED text (no `**`, no code); click again → stop; two bubbles → starting B cancels A and A's icon reverts; unmount cancels. |

**NOT touched:** `MessageBubble.tsx`, `MessageList.tsx`, `ChatInput.tsx` (pending SKIP
ruling), stores, services, routes, types, thumbs plumbing, all existing tests
(V8: byte-unmodified — verified the pinned labels survive).
**No overlap with FIX-002's uncommitted files** (`chatStore.ts`, `ChatPageContent.tsx`,
`MessageList.tsx`, `chatService.ts` — none touched here; commits stay separable).

## Test plan → gates

| Gate | Proof |
|---|---|
| V1 | unit (new readaloud test: toggle + cross-cancel) + manual script 1-2 |
| V2 | unit (prepareSpeechText: no markdown symbols, code skipped) + manual 1 |
| V3 | EXISTING (CopyButton + its pinned test) + manual 3 |
| V4 | EXISTING (CopyCodeButton) + manual 4 |
| V5 | SKIP ruling at plan review (proposal above) |
| V6 | pure frontend — suites green both modes; manual 6 |
| V7 | SSR guards in utility (existing idiom) + build clean |
| V8 | fresh baseline before first change (entering 26/180) → full board after; existing tests byte-unmodified |

## Suggested commits (zero git from me)

- `FEAT-001a: speech utility — clean text + single-owner engine (v2 seed)`
- `FEAT-001b: wire read-aloud through the speech utility`
(Scopes 2/3 need no commit — already on disk; retrospective records the drift.)

**STOP — awaiting "plan approved" + rulings on: code-skip ANNOUNCE proposal, input-copy
SKIP proposal.**
