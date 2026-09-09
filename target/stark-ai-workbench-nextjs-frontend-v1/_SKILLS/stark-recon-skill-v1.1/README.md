# stark-recon

> **An Agent Skill for the Stark Industries App Factory.** Establishes ground truth about a repo before any Architect authors a brief or FFM against it.

## What it does

Docs drift. Handbooks, APP_BRIEFs, and session logs make claims about disk state that go stale. An Architect who authors against a stale doc produces a correct artifact built on wrong data — and pays for it later in conflict after conflict at the build gate.

`stark-recon` closes that hole. The Engineer (Claudy) runs it against the actual filesystem + grep + build output and produces a **Recon Report**. The Architect authors only from that report. Where any doc and the filesystem disagree, the filesystem wins.

This is **Recon Mode** — the Architect's equivalent of Plan Mode. Plan Mode keeps the Engineer from coding blind; Recon Mode keeps the Architect from authoring blind.

## Mandatory-first

**No brief, no FFM, gets authored without a Recon Report for the repo's current state.** Every project, every kit, every phase. Re-run when significant work has landed since the last recon.

## How to run

Drop this folder under your `_SKILLS/`. Then point the agent at it:

> "Go read `_SKILLS/stark-recon/CLAUDE.md` and run a recon on this repo. Read-only. Hand me the report when done."

The agent reads `CLAUDE.md` (doctrine) → `SKILL.md` (methodology) → executes `templates/RECON_MISSION.md` → answers in `templates/RECON_REPORT_TEMPLATE.md` format → STOPS and hands back the report.

## What it is NOT

Not `brain-drain`. Brain-drain is a deep architecture extraction (11 docs, hours). Recon is fast, targeted doc-vs-disk verification (one report, ~30 min) focused only on drift that would mislead authoring.

## Contents

- `CLAUDE.md` — doctrine, mandatory-first rule, activation
- `SKILL.md` — the six-phase recon methodology
- `templates/RECON_MISSION.md` — the generic, kit-agnostic questionnaire
- `templates/RECON_REPORT_TEMPLATE.md` — the output format
- `references/EVIDENCE_DISCIPLINE.md` — finding labels + disk-wins rule
- `references/ANTI_PATTERNS.md` — recon failure modes
- `examples/` — a real successful run (Cyber Pharma v1, pre-Phase-2)

🛡️ *Part of Stark Industries — AI App Factory.*
