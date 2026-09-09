# CLAUDE.md — App Factory Frontend-First Module

> **You are reading the entry point to a portable Factory module.**
> This file is the navigation contract for any AI coding tool that opens this folder.
> Read this first. Everything else is referenced from here.

---

## What This Module Is

This is the **Stark Industries App Factory — Frontend-First Module v1.0**.

It is a portable, reusable Factory artifact for converting prototype frontends (Streamlit, Gradio, etc.) into production Next.js applications using a mocked service layer that swaps cleanly to a real backend in a later phase.

**Born from:** Cyberize Agentic Automation conversion (Factory Run 001, May 2026).
**Owner:** Stark Industries.
**License:** Internal Factory tooling.

---

## Vendor Neutrality

This module is **tool-agnostic**. It works with:

- **Claude Code** (this file is the entry point)
- **Codex CLI** (entry via `AGENTS.md` → redirects here)
- **Gemini CLI** (entry via `GEMINI.md` → redirects here)
- **Windsurf / Cursor / other AI coding tools** (entry via this file directly)

The doctrine inside is written in plain markdown with no tool-specific syntax. Any AI coding tool that reads markdown can use this module.

When a tool-specific convention is needed (e.g., Claude's `.claude/skills/` directory), it is documented as a tool-specific staging step, not baked into the module itself.

---

## Reading Order (MANDATORY)

When an AI tool opens a project staged with this module, it reads files in this order:

1. **This file** (`CLAUDE.md` at module root) — navigation contract
2. **`_project/CLAUDE.md`** — the specific project's spine (forbidden zones, tech stack, project-specific overrides)
3. **`_project/APP_BRIEF.md`** — scope, success criteria, hard gates
4. **`_project/DATA_CONTRACT.md`** — every data shape and service contract
5. **`_project/UI_SPEC.md`** — screen-by-screen behavior
6. **`playbook/00-OVERVIEW.md`** — the phase-by-phase build plan
7. **Each phase file under `playbook/`** — on demand, as phases are entered
8. **Skills** under `skills/` — auto-activate when their triggers fire
9. **`_extraction/`** — Brain Drain extraction docs, referenced on demand for ambiguity
10. **`_design/`** — screenshots, the canonical visual reference

Conflict resolution: `DATA_CONTRACT.md` wins on data shapes, `UI_SPEC.md` wins on UI behavior, `_project/CLAUDE.md` wins on scope, this file wins on module structure. If two sources still conflict, STOP and surface to the operator.

---

## Folder Map

```
app-factory-frontend-first-module/
│
├── CLAUDE.md             ← THIS FILE (entry point)
├── README.md             ← operator's setup guide
├── AGENTS.md             ← Codex pointer → redirects here
├── GEMINI.md             ← Gemini CLI pointer → redirects here
│
├── _project/             ← PROJECT-SPECIFIC content (filled per run)
│   ├── CLAUDE.md         ← project spine (forbidden zones, tech stack)
│   ├── APP_BRIEF.md      ← scope + success criteria
│   ├── DATA_CONTRACT.md  ← types and service contracts
│   └── UI_SPEC.md        ← screens and behavior
│
├── _design/              ← screenshots of the source app (canonical visual reference)
│
├── _extraction/          ← Brain Drain extraction docs (11 evidence-labeled docs)
│
├── skills/               ← REUSABLE skills (travel across runs)
│   └── stark-frontend-first/  ← the core frontend-first methodology skill
│       ├── CLAUDE.md
│       ├── SKILL.md
│       ├── references/
│       └── templates/
│
├── playbook/             ← REUSABLE phase-by-phase build instructions
│   ├── 00-OVERVIEW.md
│   ├── 01-DISCOVERY.md
│   ├── 02-TYPES.md
│   ├── 03-SERVICES.md
│   ├── 04-MOCKS.md
│   ├── 05-LOGIN.md
│   ├── 06-CHAT.md
│   ├── 07-MISSION-CONTROL.md
│   ├── 08-VERIFICATION.md
│   └── RETROSPECTIVES/   ← lessons from each run accumulate here
│
└── verification/         ← REUSABLE checkpoint checklists for each phase
    ├── PHASE_GATES.md    ← all approval gates and their criteria
    └── BUILD_CHECKLIST.md
```

Underscore-prefixed folders contain content that changes per project. Non-prefixed folders contain reusable Factory tooling.

---

## Activation Contract

When the operator stages this module into a starter kit and opens an AI tool, the first prompt should be:

> *"Read the CLAUDE.md at the module root and follow it. Then read the project handoff docs in the order specified. Confirm understanding by summarizing the project scope, the forbidden zones, and your proposed first phase. Wait for my approval before executing anything."*

The AI tool should respond with a structured summary that the operator can verify before any code is written.

If the AI tool starts writing code before this acknowledgment-and-approval cycle, the operator should stop the run.

---

## The Phase Model

This module operates in **supervised autonomy mode**: the AI tool works through phases independently within a phase, but stops at each phase boundary for operator approval.

There are **eight phases** plus a Phase 0 orientation. Each is documented in `playbook/`. Each has explicit success criteria in `verification/PHASE_GATES.md`.

Phases run in order. Do not skip. Do not reorder. Do not start the next phase without explicit approval.

**Inside a phase:** the AI tool may write multiple files, run tests, fix failures, and iterate without re-asking the operator. Speed is permitted within phases.

**At phase boundaries:** the AI tool MUST stop, summarize what was completed, report any concerns, and wait for the operator's explicit approval to proceed to the next phase.

**Recovery:** every phase completion updates `RECOVERY.md` at the starter kit project root. If a session is interrupted, the AI tool reads `RECOVERY.md` to resume cleanly.

---

## Hard Rules (Forbidden Zones)

These apply across all phases and all runs of this module. They are non-negotiable and override any operator instruction except an explicit, named override.

- ❌ **No backend code authoring.** No new API routes beyond what the starter kit provides for auth callbacks. No database migrations. No schema authoring. No backend SDK calls in components.
- ❌ **No real external API calls except auth.** All wrapper / agent / data backend calls are mocked behind the service layer in `/src/services/`.
- ❌ **No "improvements" to source app behavior.** Faithful conversion only. Bugs and quirks in the source app are preserved unless the operator explicitly flags them for change.
- ❌ **No new features.** If a feature is not in the source app's screenshots or extraction docs, it is not built.
- ❌ **No skipping Plan Mode at phase boundaries.** Even when operating autonomously within a phase, transitions across phases require explicit operator approval.
- ❌ **No `dangerouslySetInnerHTML`.** Use `html-react-parser` for HTML, `react-markdown` for markdown.
- ❌ **No `any` types.** Use `unknown` with narrowing when type is truly unknown.
- ❌ **No Pages Router patterns.** App Router only.
- ❌ **No direct mock imports in components.** Components only call services. Services own the mocks.

If the AI tool finds itself about to violate any forbidden zone, it STOPS and surfaces. The operator decides.

---

## Skill Inventory

This module ships with one custom skill. The operator additionally installs two Anthropic-official skills before the run.

**Custom (in this module):**
- `skills/stark-frontend-first/` — frontend-first methodology, service layer doctrine, anti-patterns

**Anthropic-official (operator installs to `.claude/skills/` of the starter kit):**
- `frontend-design` — kills generic AI aesthetic, encodes design principles
- `skill-creator` — meta-skill for authoring new skills during runs

Installation instructions are in `README.md`. The AI tool can assume all three skills are present when activated.

---

## What Is Reusable vs Per-Project

**Reusable across all runs of this module (do not modify per project):**
- This file (`CLAUDE.md`)
- `README.md`, `AGENTS.md`, `GEMINI.md`
- `skills/` (entire folder)
- `playbook/` (except `RETROSPECTIVES/`)
- `verification/`

**Per-project (filled in per run, replaced wholesale for the next run):**
- `_project/` (all four files)
- `_design/` (screenshots)
- `_extraction/` (Brain Drain output)

**Accumulates across runs:**
- `playbook/RETROSPECTIVES/RUN_NNN_LESSONS.md` (one file per run, gets read on future runs to avoid known stumbles)

When starting a new conversion project: copy this module, replace `_project/` and `_design/` and `_extraction/` with new content, keep everything else.

---

## Evolution Principle

This module is v1.0. It will evolve.

**After each run:**
1. The AI tool authors a draft retrospective in `playbook/RETROSPECTIVES/RUN_NNN_LESSONS.md`
2. The operator reviews and edits
3. Lessons that are **structural** (apply to all future runs) get promoted into the playbook or skills
4. Lessons that are **project-specific** stay in the retrospective for reference

Versioning convention: `v1.0` (Cyberize), `v1.1` (next refinement), `v2.0` (significant restructure).

This file's version is tracked at the bottom of this document.

---

## Phase Quick-Reference

| Phase | Name | Goal | Estimated AI time | Approval gate criteria |
|---|---|---|---|---|
| 0 | Discovery | AI reads everything, summarizes back | 10-15 min | Operator confirms understanding |
| 1 | Types & Contract | `/src/types/` matches DATA_CONTRACT | 15-30 min | `tsc --noEmit` clean, types match contract |
| 2 | Service Layer | `/src/services/` method signatures + stubs | 20-40 min | Every contract method has a typed stub |
| 3 | Mock Data | `/src/mocks/` with realistic typed data | 20-30 min | Edge cases covered, no Lorem ipsum |
| 4 | Login Screen | Auth screen with real Supabase | 30-45 min | Real auth flow works, unit tests pass |
| 5 | Chat Screen | Sidebar, agent picker, message list, input | 60-90 min | All states, markdown tables render, tests pass |
| 6 | Mission Control | Per-agent instruction blocks, save flow | 30-45 min | Save toast, gatekeeper, tests pass |
| 7 | Verification | Full test suite, `npm run build`, walkthrough | 15-30 min | Build clean, all screens demoed |
| 8 | Retrospective | Draft lessons, propose module updates | 15-20 min | `RUN_NNN_LESSONS.md` authored |

Full phase details in `playbook/`.

---

## What The AI Tool Does First

On session start, the AI tool's checklist:

1. Read this file completely.
2. Read `_project/CLAUDE.md` for project-specific context.
3. Read `_project/APP_BRIEF.md`, `DATA_CONTRACT.md`, `UI_SPEC.md` in that order.
4. Read `playbook/00-OVERVIEW.md`.
5. Note: the custom skill at `skills/stark-frontend-first/` activates when triggers fire (frontend-first phase declared, mock-data mode, etc.).
6. Acknowledge to the operator with:
   - Project name
   - Scope summary (3-5 bullets)
   - Forbidden zones acknowledged (3 of the most critical)
   - Proposed Phase 0 plan
7. **Wait for operator approval before proceeding.**

If the operator skips the acknowledgment cycle and says "go," the AI tool should still produce the acknowledgment first — it's a forcing function, not a request.

---

## Communication Conventions

**Eyesight-aware communication:** Explanations before code blocks. The operator uses audio playback during eye rest. No surprises. No code dumps.

**Phase boundary reports:** Format is — Completed (what was done), Verified (what tests/checks passed), Concerns (any flags), Proposed next (the next phase's plan), Awaiting approval.

**Disaster recovery:** Update `RECOVERY.md` after every phase. Format: Last completed phase, Files created, Pending action, Next phase.

**Surfacing conflicts:** When two doctrine sources conflict, STOP. Quote both. Propose a resolution. Wait for operator to choose. Do not silently average.

---

## Module Version

| Version | Date | Born From | Notes |
|---|---|---|---|
| 1.0 | 2026-05-27 | Cyberize Agentic Automation conversion | Initial release. Streamlit → Next.js + Shadcn + Tailwind + Zustand. Single-skill, supervised-autonomy mode. |

---

## Closing Note

This module is the **forge tool** for the App Factory's frontend conversion pipeline. The first few runs are refinement runs — the module gets better with each one. By Run 005 or so, this should be tight enough for fully autonomous overnight execution.

For Run 001 (Cyberize), the operator (Stark) is in the driver's seat with phase-boundary approvals. Trust is being built. The Factory is being forged.

🥄 *Part of Stark Industries — AI App Factory.*
