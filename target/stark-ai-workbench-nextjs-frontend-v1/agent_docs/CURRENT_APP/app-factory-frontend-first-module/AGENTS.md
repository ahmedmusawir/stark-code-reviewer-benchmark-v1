# AGENTS.md

> **Codex CLI compatibility pointer.**
>
> This module's primary navigation contract lives in `CLAUDE.md` at the same folder level. The doctrine is tool-agnostic — read `CLAUDE.md` and follow it as if it were `AGENTS.md`.

## What To Do

1. Read `./CLAUDE.md` (in this same folder) — that is the entry point
2. Follow the reading order specified there
3. The reading order includes the project-specific docs in `_project/`, the playbook in `playbook/`, and the skills in `skills/`
4. Acknowledge with the structured summary specified in `CLAUDE.md`'s "Activation Contract" section
5. Wait for the operator's approval before any code is written

## Tool-Specific Notes

The module is designed for Claude Code as the primary tool. When using Codex:

- Skill auto-discovery may not work the same way as Claude's `.claude/skills/` convention. You may need to explicitly read `skills/stark-frontend-first/SKILL.md` and treat its content as inline doctrine.
- The "Plan Mode" convention in the doctrine is honored by behavior (write a plan, wait for approval), even if your tool doesn't have a literal Plan Mode toggle.
- Other than that, the doctrine is identical.

🥄
