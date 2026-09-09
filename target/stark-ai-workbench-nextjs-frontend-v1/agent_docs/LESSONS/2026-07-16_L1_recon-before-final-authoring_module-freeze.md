# LESSON L1 — Recon Before Final Authoring · Module Folders Freeze While the Engineer Holds Them

> **Location doctrine:** this file lives at `agent_docs/LESSONS/` — the permanent, repo-level lessons home (sibling of `RECON/` and `RESPONSES/`). Timestamped filename, append-never-edit. Machine-readable on purpose: a future MCP-driven Claudy pass reads this folder and proposes factory-doc updates from it.
> **Scope:** App Factory doctrine (BIMs; retro-applies the FFM standard) · **Recorded:** 2026-07-16 · **Source module:** BIM-001 Stage A→B transition

---

## What happened

BIM-001's Stage B implementation docs were fully authored 2026-07-10 — six days before recon existed — from a doc-stack snapshot. Stage A recon (2026-07-16) then found two defects in the authoring itself: a gate demanding a lint step the toolchain no longer supports (AM-1) and a real infrastructure URL committed inside a doc "example" (AM-2). Fixing them required amending files inside the module folder **while the module was mid-flight** — something no FFM execution ever required, because FFM docs were final before the Engineer entered.

## What held

The stage gate did its job: zero code was written against unreconciled docs. The Engineer was stopped at the Stage B entry conditions when the amendments landed. The invariant *"the Engineer never executes against unreconciled documents"* was never violated.

## What was violated

1. **Authoring-from-informed-state:** execution-grade docs were written against assumptions instead of recon evidence, forcing recon to act as a repair pass instead of a foundation.
2. **Module immutability under Engineer mandate (THE core failure, named by the Coordinator):** files were added/replaced inside an active module's folder. FFM doctrine never permitted this; BIM doctrine must not either.

## LOCKED RULES (BIM-002+ and all future FFMs)

1. **Just-in-time authoring.** Implementation-grade module docs are authored only after (a) the previous module's retrospective exists and (b) a fresh recon of the current repo state is in hand. Until then a phase holds only a **Phase Seed Brief** — mission, why, dependencies, expected start state, likely scope, open questions — explicitly labeled non-executable.
2. **Module folders freeze at handoff.** From the moment the Engineer is pointed at a module folder until the moment he STOPs at a stage gate or completes the module, **nothing inside that folder is added, edited, or replaced by anyone.** Architect outputs produced during a module (verdicts, amendments) are staged OUTSIDE the module and merged into it only at a stage gate, while the Engineer holds no active mandate — announced to the Engineer as part of the next launch instruction.
3. **DRAFT until stamped.** Any implementation docs that must coexist with a not-yet-run recon stage carry **DRAFT — CLAIM STATUS** headers until the Architect's post-recon verdict stamps them FINAL. After the stamp: frozen; changes require a formally versioned re-open with Coordinator sign-off, executed only at a gate.
4. **Placeholders from the first keystroke.** Example rows in contract docs use structural placeholders always. Real values never enter a document — even as "examples." (This is exactly how the Architect leaked a URL into git history.)
5. **Lessons live at repo level.** `agent_docs/LESSONS/`, timestamped filenames, one lesson per file, append-never-edit. Never inside a module folder — modules end; lessons compound.

## Credit

Defect caught by the Engineer (Claudy, Stage A). Process root-cause — the mid-module mutation — diagnosed by the Coordinator (Tony). Recorded by the Architect (Jarvis), no ego, lesson owned.
