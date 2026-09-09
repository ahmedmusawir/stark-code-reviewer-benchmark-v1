# README — App Factory Frontend-First Module

> **For the human operator.** AI tools should start with `CLAUDE.md` instead.

---

## What This Is

A portable Factory module for converting Streamlit (or similar) prototype frontends into production Next.js applications using a mocked service layer. Born from the Cyberize Agentic Automation run, May 2026.

This README is for you, the operator. The AI tool's entry point is `CLAUDE.md` at the module root.

---

## Quick Start (For Run 001 — Cyberize)

### Step 1 — Stage The Module

Drop this entire `app-factory-frontend-first-module/` folder into your starter kit's `agent_docs/CURRENT_APP/` directory:

```
your-starter-kit/
├── agent_docs/
│   ├── APP_FACTORY/
│   └── CURRENT_APP/
│       └── app-factory-frontend-first-module/   ← drop here
│           ├── CLAUDE.md
│           ├── README.md
│           └── ... (everything else)
├── src/
└── package.json
```

The module is now staged. Files in `_project/`, `_design/`, and `_extraction/` are already filled in for the Cyberize project.

### Step 2 — Install The Anthropic Skills

The module ships with one custom skill (`stark-frontend-first`). The build needs two more from Anthropic's official skills repo.

From your starter kit's project root:

```bash
# Create the skills directory if it doesn't exist
mkdir -p .claude/skills

# Clone Anthropic's skills repo to a scratch location
cd /tmp
git clone --depth 1 https://github.com/anthropics/skills.git anthropic-skills

# Copy the two skills we need
cp -r anthropic-skills/frontend-design /path/to/your-starter-kit/.claude/skills/
cp -r anthropic-skills/skill-creator /path/to/your-starter-kit/.claude/skills/

# Copy our custom skill from this module to the same place
cp -r /path/to/this-module/skills/stark-frontend-first /path/to/your-starter-kit/.claude/skills/

# Verify
ls /path/to/your-starter-kit/.claude/skills/
# Should show: frontend-design  skill-creator  stark-frontend-first

# Cleanup
rm -rf /tmp/anthropic-skills
```

**Note:** The exact paths in the Anthropic skills repo may shift over time. If `frontend-design` or `skill-creator` aren't where expected, find them via the repo's directory listing. They are official, well-known skills — they exist.

### Step 3 — Verify The Stack

Open a terminal in your starter kit root and confirm:

```bash
# Should show your three skills
ls .claude/skills/

# Should show the module
ls agent_docs/CURRENT_APP/app-factory-frontend-first-module/

# Should show CLAUDE.md, package.json, etc.
ls
```

### Step 4 — Open Claude Code

From the starter kit root:

```bash
claude
```

Claude Code starts. It reads the starter kit's root `CLAUDE.md` automatically. That root file should point Claude at the module — see "Bridging The Module Into Your Starter Kit" below if it doesn't.

### Step 5 — Issue The Boot Prompt

Copy and paste this exactly to Claude:

> **Boot prompt:**
>
> Read the CLAUDE.md at `agent_docs/CURRENT_APP/app-factory-frontend-first-module/CLAUDE.md` and follow its instructions exactly. Read the project handoff docs in the order specified. Confirm understanding by summarizing: (1) the project name and scope, (2) the three most critical forbidden zones, and (3) your proposed Phase 0 plan. Then STOP and wait for my approval before proceeding to any other work.

Claude responds with the structured acknowledgment. You verify it makes sense. You approve Phase 0 or correct the AI before any code is written.

---

## Bridging The Module Into Your Starter Kit

Your starter kit has its own root `CLAUDE.md`. The module's `CLAUDE.md` is one level deeper. For Claude Code to find the module on session start, add a pointer line to your starter kit's root `CLAUDE.md`.

Add a section near the top of your starter kit's root `CLAUDE.md`:

> **Active Project Module**
>
> The current project's Factory module lives at `agent_docs/CURRENT_APP/app-factory-frontend-first-module/`. Read `CLAUDE.md` in that folder for project-specific direction, doctrine, and the phase-by-phase playbook. All work for the current project follows that module.

That's it. One paragraph. Claude reads root `CLAUDE.md` first, sees the pointer, follows it.

If you want to test it works: open Claude Code and ask "what project are you working on?" — Claude should answer based on the module's content, not generic starter-kit defaults.

---

## The Run

Once the boot prompt is acknowledged and Phase 0 is approved, the run proceeds through eight phases:

- **Phase 0:** Discovery (Claude reads, summarizes, awaits approval)
- **Phase 1:** Types & Contract
- **Phase 2:** Service Layer Scaffolding
- **Phase 3:** Mock Data
- **Phase 4:** Login Screen
- **Phase 5:** Chat Screen
- **Phase 6:** Mission Control Screen
- **Phase 7:** Verification & Build
- **Phase 8:** Retrospective

Within each phase, Claude works autonomously — writes files, runs tests, fixes failures, iterates. At each phase boundary, Claude stops and reports. You approve or correct. Then next phase.

Estimated total time: half a day to one day of focused work. Most of that is Claude generating code. Your time is concentrated in the eight approval gates.

Full phase details are in `playbook/` inside the module.

---

## What's In This Module

### Reusable Across All Runs

These don't change between projects:

- **`CLAUDE.md`** — module-level navigation contract (entry point for AI tools)
- **`README.md`** — this file
- **`AGENTS.md`** — Codex pointer
- **`GEMINI.md`** — Gemini CLI pointer
- **`skills/stark-frontend-first/`** — the frontend-first methodology skill
- **`playbook/`** — phase-by-phase build instructions
- **`verification/`** — approval gate checklists

### Project-Specific (Replaced Per Run)

These change for each new conversion:

- **`_project/`** — APP_BRIEF, DATA_CONTRACT, UI_SPEC, project CLAUDE.md
- **`_design/`** — screenshots of the source app
- **`_extraction/`** — Brain Drain extraction docs

### Accumulates Across Runs

- **`playbook/RETROSPECTIVES/`** — one file per run, lessons that inform future runs

---

## Vendor Compatibility

This module is designed to work with multiple AI coding tools:

| Tool | Entry File | Notes |
|---|---|---|
| Claude Code | `CLAUDE.md` | Primary, fully tested |
| Codex CLI | `AGENTS.md` → redirects to `CLAUDE.md` | Compatible; minor adaptation may be needed |
| Gemini CLI | `GEMINI.md` → redirects to `CLAUDE.md` | Compatible; minor adaptation may be needed |
| Windsurf / Cursor | `CLAUDE.md` directly | Compatible |

The doctrine inside is tool-agnostic. Tool-specific staging steps (like installing skills to `.claude/skills/`) are documented per tool.

---

## Starting A New Project With This Module

After Cyberize ships, you'll want to reuse this module for the next Streamlit conversion. Here's the workflow:

1. **Copy the module folder** to a new location (or git checkout a fresh copy)
2. **Empty the project-specific slots:**
   - Delete contents of `_project/`, `_design/`, `_extraction/`
3. **Run Brain Drain** on the new source app
4. **Fill in the new project content:**
   - Drop Brain Drain output into `_extraction/`
   - Drop new screenshots into `_design/`
   - Author new `_project/APP_BRIEF.md`, `DATA_CONTRACT.md`, `UI_SPEC.md`, `CLAUDE.md` (you can use the Cyberize versions as templates)
5. **Keep everything else** — the skill, the playbook, the verification checklists, the README. Those are reusable.
6. **Stage and run** the same way as Run 001

By Run 003 or 004, the playbook should be tight enough to support fully autonomous overnight runs.

---

## Lessons From Previous Runs

Read `playbook/RETROSPECTIVES/` before starting a new run. Especially:

- `RUN_001_CYBERIZE_LESSONS.md` (authored after Cyberize Phase 8 completes)

Lessons that emerge as **structural** (applying to all future runs) get promoted into the playbook or skills. Lessons that stay project-specific live in the retrospectives folder for reference.

---

## Operator Cheat Sheet

**Starting a session mid-run (after interruption):**

> "Read RECOVERY.md at project root, then read the CLAUDE.md at `agent_docs/CURRENT_APP/app-factory-frontend-first-module/CLAUDE.md`, then continue from where we left off. Report the last completed phase and propose the next phase before doing any work."

**If Claude drifts into a forbidden zone:**

> "STOP. You touched a forbidden zone. Read `_project/CLAUDE.md` again and tell me which zone you violated. Then we recover."

**If Claude skips an approval gate:**

> "STOP. You skipped a phase boundary. Roll back the work that wasn't approved. Read the playbook for the current phase and re-propose."

**Ending a session cleanly:**

> "Update RECOVERY.md with the current state and the next action. Don't start anything new."

---

## Troubleshooting

**Claude doesn't recognize the module:**
- Verify the bridge pointer is in your starter kit's root `CLAUDE.md` (see "Bridging The Module Into Your Starter Kit" above)
- Verify the module folder name matches what's in the pointer
- Try the boot prompt again, more explicitly with the full path

**Skill doesn't activate:**
- Verify the skill folder is in `.claude/skills/` (not nested deeper)
- Verify the skill's `SKILL.md` has proper YAML frontmatter at the top
- Restart Claude Code to refresh skill discovery

**Build fails at phase gate:**
- Read `verification/PHASE_GATES.md` for the specific gate's criteria
- If criteria aren't met, do NOT advance — fix or surface the issue
- If criteria are subjective ("looks right"), trust your eyes

**Mock data doesn't match real backend later:**
- Run 001 lesson — this is why the DATA_CONTRACT is so detailed
- Update DATA_CONTRACT first, then types, then mocks, then UI

---

## Credits

- **Module designer:** Claude (acting as Tony Stark's Chief Architect)
- **Module operator:** Tony Stark (Moose)
- **Source extraction:** Claude Code via Brain Drain skill
- **Methodology:** Stark Industries AI App Factory doctrine, compiled from 22+ playbooks and manuals

---

## Version

**v1.0** — Born from Cyberize Agentic Automation conversion, May 2026.

🥄 *Part of Stark Industries — AI App Factory.*
