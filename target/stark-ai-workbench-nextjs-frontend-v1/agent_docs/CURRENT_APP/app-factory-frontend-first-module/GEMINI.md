# GEMINI.md

> **Gemini CLI compatibility pointer.**
>
> This module's primary navigation contract lives in `CLAUDE.md` at the same folder level. The doctrine is tool-agnostic — read `CLAUDE.md` and follow it as if it were `GEMINI.md`.

## What To Do

1. Read `./CLAUDE.md` (in this same folder) — that is the entry point
2. Follow the reading order specified there
3. The reading order includes the project-specific docs in `_project/`, the playbook in `playbook/`, and the skills in `skills/`
4. Acknowledge with the structured summary specified in `CLAUDE.md`'s "Activation Contract" section
5. Wait for the operator's approval before any code is written

## Tool-Specific Notes

The module is designed for Claude Code as the primary tool. When using Gemini CLI:

- Skill auto-discovery may differ. You may need to explicitly read `skills/stark-frontend-first/SKILL.md` and treat its content as inline doctrine.
- The "Plan Mode" convention is honored by behavior (write a plan, present it, wait for approval), even if your tool doesn't have a literal Plan Mode toggle.
- Tool calls may have different syntax — adapt as needed.
- Other than that, the doctrine is identical.

🥄
