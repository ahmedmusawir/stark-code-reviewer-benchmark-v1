# CLAUDE.md — FEAT-001 (Read-Aloud + Copy Everywhere) — FINAL

> **You are reading the manager file for FEAT-001.** Read this FIRST. Status: **FINAL — stamped 2026-07-18.** Launch condition: **only after BIM-002 closes** (Coordinator will confirm in the launch message). This folder is **FROZEN from launch until you STOP** (Lesson L1 Rule 2).

---

## Mission (one sentence)

Make the chat accessible by ear and by clipboard: a working read-aloud (speaker) control on assistant messages using the browser's built-in speech engine, and working copy buttons on messages, code blocks, and the chat input — no backend, no API keys, no new services.

## Why this module exists

The Coordinator's primary interface with long content is audio (vision constraint — this is an accessibility feature, not a garnish). The UI already renders speaker and copy icons under messages (visible in production screenshots) — they are currently decorative. This module wires them, and adds copy where it's missing.

## Version doctrine (v1 now, v2 seeded, NOT built)

- **v1 (THIS module):** Web Speech API (`window.speechSynthesis`) — zero backend, zero cost, works offline. Voice quality is robotic; that is accepted for v1.
- **v2 (FUTURE, not yours):** premium TTS via Google AI Studio Gemini TTS (Coordinator holds a Tier-2 billed key). The v1 design isolates speech behind ONE utility function (`src/utils/speech.ts` or similar) so v2 swaps the engine without touching components. Do not build v2, do not add env vars, do not reference any API key.

## Scope (P0)

1. **Read-aloud on assistant messages:** speaker icon toggles play/stop. Speaking a new message cancels the previous. Text is cleaned before speaking: markdown syntax stripped, code blocks SKIPPED entirely (announce "code block skipped" or silently omit — Engineer proposes, plan decides), URLs shortened to domain. Visual state on the icon while speaking. Cancel on unmount/navigation.
2. **Copy message:** existing copy icon on message bubbles copies the message's raw markdown text. Feedback: icon swaps to a check for ~2s.
3. **Copy code block:** every fenced code block inside rendered messages gets a small copy button (top-right convention) copying the raw code only. Same feedback pattern.
4. **Copy from chat input:** if the input area lacks a copy affordance, add one (copies current draft). If native selection+copy already suffices there, Engineer may propose SKIP with rationale at plan review.
5. Tests for the clean-text utility (markdown stripping, code-skip) and copy handlers (clipboard mocked).

## Out of scope (say it loud)

- ❌ Premium TTS / AI Studio / Vertex — v2 seed only
- ❌ Voice INPUT (dictation) — different feature, future seed
- ❌ Auto-play, read-on-arrival, or reading user messages aloud (manual trigger only, assistant messages only, v1)
- ❌ Thumbs up/down icons — they stay decorative (feedback plumbing is its own future module)
- ❌ Services, stores (beyond a trivial speaking-state hook if needed), routes, types — this is components + one utility
- ❌ Restyling anything — wire the icons that exist; add only what's missing (code-block button, input copy)

## TO VERIFY FIRST — your plan MUST open with these (file:line evidence)

1. Which component renders the message action icons (copy/speaker/thumbs) and their current handlers (or absence)
2. How markdown + code blocks are rendered (`MessageBubble.tsx` uses a syntax-highlight theme per recon — identify the renderer: react-markdown? custom?) and where a code-block wrapper hooks in
3. The chat input component and whether an input-copy affordance is warranted (see Scope 4)
4. `speechSynthesis` availability guard pattern for SSR (must not run server-side)

## Gates

| # | Gate |
|---|---|
| V1 | Speaker on an assistant message reads it aloud; click again stops; starting another message stops the first |
| V2 | Code blocks are not read aloud; markdown symbols are not read as symbols ("asterisk asterisk" = FAIL) |
| V3 | Message copy puts the full message text on the clipboard; check-feedback shows and reverts |
| V4 | Every code block shows a copy button; copies raw code only |
| V5 | Input copy per plan ruling (works, or ruled SKIP) |
| V6 | Mock AND live mode both work (feature is mode-agnostic — pure frontend) |
| V7 | No SSR crash (`speechSynthesis`/`navigator.clipboard` guarded); build clean |
| V8 | Green board: build + `tsc --noEmit` + full Jest suite; existing tests unmodified |

## Manual verification script (Coordinator)

1. Live mode: ask an agent for "a short explanation with a code example" → speaker reads the prose, skips the code · 2. Click speaker on a second message mid-speech → first stops, second plays · 3. Copy the message → paste in a text editor → full text present · 4. Copy the code block → paste → code only · 5. Reload → everything still wired · 6. Flip to mock → all of it works identically.

## Launch procedure

Plan Mode, ONE message: the four verifications with evidence · file list created/modified with rationales · the code-skip announcement proposal (Scope 1) · input-copy ruling proposal (Scope 4) · test plan mapped to V1–V8. STOP until "plan approved."

## Definition of done

Gates green · commits `FEAT-001:` tagged, one per concern · CHANGELOG + session log · `RETROSPECTIVE.md` here (sanctioned write; v2-TTS design notes go in it as the seed) · STOP.

---

**Operator launch line (ONLY after BIM-002 closes):**
> *"Claudy — BIM-002 is closed. Read `agent_docs/CURRENT_APP/FEAT001/CLAUDE.md` and begin. Plan Mode."*

**Version 1.0-FINAL** · 2026-07-18 · Architect: Jarvis (Fable 5). Accessibility is not a garnish.
