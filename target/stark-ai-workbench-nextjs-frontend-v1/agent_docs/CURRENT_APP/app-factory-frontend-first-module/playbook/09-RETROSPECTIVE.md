# Phase 8 — Retrospective

> **Goal:** Author the run's retrospective document. Capture lessons. Propose module v1.1 updates.
> **AI time:** 15-20 min | **Review time:** 30 min
> **Pre-req:** Phase 7 approved

---

## What This Phase Does

The Factory learns from every run. This phase produces the artifact that makes the next run sharper.

The retrospective is NOT a status report. It's an evidence-based capture of what worked, what stumbled, and what should change in the module before the next run.

---

## Steps

### Step 1 — Create The Retrospective File

`playbook/RETROSPECTIVES/RUN_001_CYBERIZE_LESSONS.md` (or the appropriate run number for future runs).

### Step 2 — Author The Retrospective

Use this structure:

```markdown
# Run 001 — Cyberize Conversion — Retrospective

**Date:** [completion date]
**Source app:** google-adk-n8n-hybrid-streamlit-v2 (Streamlit)
**Target:** Next.js + Shadcn + Tailwind + Zustand
**Module version used:** v1.0
**Operator:** Stark
**AI tool:** Claude Code

---

## Phase-By-Phase Time Log

| Phase | Estimated | Actual | Notes |
|---|---|---|---|
| 0 Discovery | 10-15 min | [actual] | [observations] |
| 1 Types | 15-30 min | [actual] | [observations] |
| 2 Services | 20-40 min | [actual] | [observations] |
| 3 Mocks | 20-30 min | [actual] | [observations] |
| 4 Login | 30-45 min | [actual] | [observations] |
| 5 Chat | 60-90 min | [actual] | [observations] |
| 6 Mission Control | 30-45 min | [actual] | [observations] |
| 7 Verification | 15-30 min | [actual] | [observations] |
| Total | half-day to day | [actual] | |

## Where I Stumbled

For each stumble, name the phase, what went wrong, what I did to recover, and whether the module's doctrine could have prevented it.

- [Stumble 1: phase / description / recovery / preventable?]
- [Stumble 2: ...]

## Where The Handoff Package Was Thin

Did any of `_project/APP_BRIEF.md`, `DATA_CONTRACT.md`, `UI_SPEC.md` have gaps I had to fill in from extraction docs or screenshots?

- [Gap 1: which doc, what was missing, what I used instead]
- [Gap 2: ...]

## Where The Skill Doctrine Was Tight

What worked well from `stark-frontend-first` skill?

- [Win 1: ...]
- [Win 2: ...]

## New Anti-Patterns Discovered

Did I (or come close to) any failure mode not already in ANTI_PATTERNS.md?

- [New anti-pattern 1: description / how I caught it / proposed addition to ANTI_PATTERNS.md]

## Mock-vs-Real Risk Areas

What aspects of my mocks might fail to match the real wrapper response in Phase 2 of the overall project?

- [Risk 1: ...]

## Tool Performance Notes

How did the three skills perform?

- frontend-design: [observations]
- skill-creator: [observations — likely unused this run unless retrospective proposes new skills]
- stark-frontend-first: [observations]

## Proposed Module Updates For v1.1

Concrete changes I'd make to the module before the next run:

1. [Change: file / section / proposed update / rationale]
2. [Change: ...]

## Time Estimate Recalibration

Based on actual times, should the estimates in `playbook/00-OVERVIEW.md` be updated?

- [Phase: old estimate → new estimate / why]

## What Worked About Supervised Autonomy

Was supervised autonomy the right level? Could we push to fuller autonomy next run?

- [Observation: ...]

## What I'd Tell The Next Run

One paragraph distilling the most important lesson for whoever (or whichever AI tool) runs this module next.

[Paragraph here]
```

### Step 3 — Operator Review And Edit

The operator reads the draft retrospective. Edits, expands, adds nuance the AI couldn't see.

### Step 4 — Promote Structural Lessons

If any lesson applies to ALL future runs (not just this project), it gets promoted into the module's permanent doctrine:

- New anti-pattern → add to `skills/stark-frontend-first/references/ANTI_PATTERNS.md`
- New service pattern → add to `skills/stark-frontend-first/references/SERVICE_LAYER_PATTERNS.md`
- Time estimate recalibration → update `playbook/00-OVERVIEW.md`
- New phase step → update the relevant phase playbook file
- Bigger structural change → bump module version to v1.1

Project-specific lessons stay in the retrospective and inform reviewers, not the doctrine.

### Step 5 — Phase 8 Completion Report

```
## Phase 8 Complete — Retrospective

### Completed
- Created: playbook/RETROSPECTIVES/RUN_001_CYBERIZE_LESSONS.md
- Drafted N findings across the run
- Proposed N module updates for v1.1

### Promoted To Permanent Doctrine
- [list any structural lessons promoted]

### Project-Specific Lessons Retained
- [list any project-only lessons that stay in retrospective]

### RUN 001 STATUS: COMPLETE

The Cyberize Agentic Automation Next.js conversion is feature-complete for Phase 1 of the overall project. Backend swap (Phase 2 of overall project) is now unblocked. The module has produced its first verified output and the doctrine has been refined.

🥄 Forge is hot. Ready for Run 002.
```

### Step 6 — Final Update To RECOVERY.md

```
# Recovery State
Last completed phase: Phase 8 — Retrospective
Run 001: COMPLETE
Module version: v1.0 (next: v1.1 with retrospective lessons)
Next steps: Operator-driven (Phase 2 of overall project — real backend wiring)
```

---

## Verification Gate

- [ ] Retrospective file exists at correct path
- [ ] All sections of the retrospective template are filled in
- [ ] Operator has reviewed and edited
- [ ] Structural lessons have been promoted (or explicitly noted as none)
- [ ] Module version bump decided (stay v1.0 or move to v1.1)

---

## Anti-Patterns To Avoid

- ❌ Generic "everything went great" retrospectives — must be honest about stumbles
- ❌ Listing every minor issue — focus on what's structurally informative
- ❌ Promoting project-specific quirks to permanent doctrine
- ❌ Skipping retrospective "because I'm tired" — this is the highest-leverage output of the run
