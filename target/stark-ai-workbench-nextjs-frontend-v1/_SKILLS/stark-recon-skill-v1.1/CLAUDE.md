# CLAUDE.md — stark-recon

> **You are reading the manager file for the `stark-recon` skill.** Read this FIRST, then `SKILL.md`. This file is always-on doctrine; SKILL.md is the methodology.

---

## Identity / Mission

`stark-recon` is an **Agent Skill** in the Stark Industries App Factory. Its job: **establish ground truth about a repo before any Architect authors a brief or an FFM against it.**

The skill exists because of one hard-won lesson: **docs lie.** Starter-kit handbooks, APP_BRIEFs, and prior session logs make claims about disk state that drift out of true. An Architect who authors against a stale doc produces a *correct artifact built on wrong data* — and the cost surfaces later as conflict after conflict at the Engineer's build gate.

`stark-recon` closes that hole. The Engineer (Claudy) runs it against the actual filesystem + grep + build output and produces a **Recon Report**. The Architect authors only from that report. **Where any doc and the filesystem disagree, the filesystem wins — every time.**

This is the **Recon Mode** protocol — the Architect's equivalent of Plan Mode. Plan Mode keeps the Engineer from coding blind. Recon Mode keeps the Architect from authoring blind. Together they ground all three roles (Operator, Architect, Engineer) against one verified source of truth.

---

## MANDATORY-FIRST (Non-Negotiable Doctrine)

**No brief and no FFM may be authored for a repo until a `stark-recon` Recon Report exists for that repo's current state.**

- The Architect is **forbidden** from authoring `APP_BRIEF`, `DATA_CONTRACT`, `UI_SPEC`, `_project/CLAUDE.md`, or any FFM file without a Recon Report in hand.
- This applies to **every project, every kit, every phase** — not just the first.
- A Recon Report goes stale. If significant work has landed since the last recon (a phase closed, a kit upgraded, branches merged), **re-run recon** before authoring the next brief/FFM.
- The Operator may explicitly override (with acknowledgment) for trivial cases — but the default is: recon first, always.

If an Architect starts authoring without a report, that is a process violation. Surface it and run recon first.

---

## Skill Type & Activation

- **Type:** Agent Skill (the agent executes autonomously; the operator does not paste each command).
- **Invocation:** manual. Operator points the agent at this folder: *"Go read `_SKILLS/stark-recon/CLAUDE.md` and run a recon."*
- **Execution:** read-only **of the inspected codebase**. The agent greps, reads files, runs the build, and assembles the report. **It makes NO changes to source, NO fixes, NO git operations, NO `cd && git`.** The ONE write it makes is the report file itself (see Output Contract below) — that is the deliverable, not a mutation of the code under inspection.
- **Plan Mode:** compressed. Because the inspection is read-only and low-risk, the agent does NOT gate on each command. It announces the recon scope, executes the sweep + sections, and writes the report.
- **The one checkpoint:** the agent writes the report **to a file**, then STOPS and hands the Architect the file path. The Architect reviews the file before authoring. That handoff is the mandatory gate.

---

## Folder Tree

```
stark-recon/
├── CLAUDE.md                          ← THIS FILE (doctrine, mandatory-first, activation)
├── SKILL.md                           ← v2 methodology (the recon phases)
├── README.md                          ← human-facing description
├── templates/
│   ├── RECON_MISSION.md               ← the generic questionnaire (the payload to execute)
│   └── RECON_REPORT_TEMPLATE.md       ← the output format the report follows
├── references/
│   ├── EVIDENCE_DISCIPLINE.md         ← the labels + "disk wins" rule
│   └── ANTI_PATTERNS.md               ← recon-specific failure modes
└── examples/
    └── cyber-pharma-v1-phase2-recon-2026-06-08.md   ← a proven successful run
```

---

## Doctrine — Always In Effect

1. **Disk wins.** Where any doc and the filesystem disagree, the filesystem is truth. Flag every drift.
2. **Evidence discipline.** Every finding is labeled EVIDENCE / INFERENCE / CLAIM / GAP / QUESTION (see `references/EVIDENCE_DISCIPLINE.md`). The Architect must be able to tell what was verified vs guessed.
3. **Read-only of the inspected codebase.** No mutations to source. The recon observes; it never fixes. Defects found are *reported*, not patched — fixing is a separate authorized pass. (This does NOT forbid writing the report file — that's the deliverable; see rule 7.)
4. **Ground-truth the Day-0 sweep first.** Section 0 of the mission (verify handbook-named files exist, run the forbidden-zone greps, confirm the route table) runs before everything else. It catches the highest-value drift fastest.
5. **The Surprises section is the gold.** The open-ended sweep is where the NEXT unknown lesson gets found. Never skip it.
6. **One pass, one report.** Answer the whole mission, hand back one structured report. Don't trickle findings.
7. **OUTPUT CONTRACT — the report MUST be written to a file.** Never produce the recon on-screen only. The full report is written to:
   ```
   agent_docs/recon/RECON_<project>_<phase>_<YYYY-MM-DD>.md
   ```
   (Create `agent_docs/recon/` if it doesn't exist.) On-screen, the agent prints only a SHORT confirmation + the file path + a 3-5 line headline summary. The full report lives in the file so the Architect can read, diff, and keep it. A recon that exists only in chat scrollback is a failed recon — it can't be referenced, version-tracked, or handed off cleanly.

---

## Reading Order

1. This file (`CLAUDE.md`) — doctrine
2. `SKILL.md` — the methodology / phases
3. `templates/RECON_MISSION.md` — the questions to answer from disk
4. `templates/RECON_REPORT_TEMPLATE.md` — the format to answer them in
5. `references/EVIDENCE_DISCIPLINE.md` — how to label findings
6. `examples/` — what a finished report looks like

---

## Operator Override Protocol

The Operator may override any default with explicit acknowledgment:
- Skip a mission section ("the DB section is N/A this run") → the agent notes the skip in the report.
- Proceed to author without recon (trivial case) → the agent surfaces the MANDATORY-FIRST rule once, then defers to the Operator's explicit call.
- Re-scope the mission (add/remove questions) → the agent adapts and notes what changed.

Override is explicit and acknowledged, never assumed. Absent an override, the defaults above hold.

---

## Evolution Principle

This skill grows with every run. When a new class of doc-vs-disk drift surfaces that the mission didn't ask about, it gets added to `templates/RECON_MISSION.md` (and the lesson noted in the version history). The Cyber Pharma v1 Phase 1 run seeded the mission with 13 sections; future runs sharpen it.

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-06-08 | Initial skill. Authored from the Cyber Pharma v1 Phase 1 proving-ground run (34 lessons) + the v0.4 recon questionnaire. Agent Skill, single, evidence-disciplined, mandatory-first. Mission carries the Day-0 ground-truth sweep + 13 sections. Example: the Phase-2 pre-authoring recon that confirmed the post-Phase-1 repo state. |
| 1.1 | 2026-06-09 | OUTPUT CONTRACT added: the report MUST be written to a file at agent_docs/recon/RECON_<project>_<phase>_<date>.md, never on-screen only (early runs went to screen because "read-only" was misread as "write nothing"). Clarified read-only boundary = inspected codebase, not the report deliverable. Added write tool to allowed-tools, AP-10 (on-screen-only failure), Phase-5 file-write step. |
