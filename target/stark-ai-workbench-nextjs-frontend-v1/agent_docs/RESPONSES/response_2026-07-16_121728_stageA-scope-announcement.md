# BIM-001 · Stage A (Recon) — Scope Announcement

**Time:** 2026-07-16 12:17
**Engineer:** Claudy · **Mode:** stark-recon v1.1 (compressed Plan Mode — read-only)
**Status:** Announced, awaiting Coordinator nod + wrapper URL before execution.

---

## Engine + payload

- **Engine:** `stark-recon` skill — six phases, five evidence labels (EVIDENCE / INFERENCE /
  CLAIM / GAP / QUESTION), disk-wins, mandatory Surprises section, one report to file.
- **Addendum:** `STAGE_A_RECON_MISSION.md` — the BIM payload riding on the engine.

## What I will execute (all read-only of the codebase)

**Skill phases 0–5**, focused by the BIM addendum:

- **Assumption checklist A1–A12** — verify each Stage-B claim against disk with file:line /
  grep / listing evidence; every doc-vs-disk mismatch flagged as drift (both sides quoted):
  - A1–A3: chatService signatures, the `BACKEND_SWAP_NOTES` block, type shapes in `src/types/index.ts`
  - A4–A6: no agent routes yet, no `NEXT_PUBLIC_CHAT_MODE` flag, no `ADK_WRAPPER_URL`/live fetch
  - A8: profileService `AgentSessionMap` + instructionsService GCS shape (both mocked)
  - A9: Stage-B forbidden-zone paths exist as named (name drift = flagged)
  - A10: build/lint/test scripts present per gate G10
- **Baseline (§C):** `npm ci` → full test suite → lint + build; verbatim summaries + route
  table. Any failure = a finding (B1, B2…) logged, **not fixed** (modifying tests is forbidden).
- **Surprises sweep (Phase 5):** orphans, latent risks, stale docs — the gold.

## The single authorized network call (§D)

- Exactly **one**: `GET {ADK_WRAPPER_URL}/health` (A11). Compare returned agent list to
  Stage-B docs. Unreachable = critical finding, max one retry. **No POSTs.**

## Read-only git (standing ruling 1)

- `git status --porcelain`, current branch, HEAD short-SHA — captured before + after. Nothing else.

## Machine-state changes I will make

- Dependency install only (`npm ci`) so the baseline suite can run (standing ruling 3).
- Two directories created for outputs: `agent_docs/RESPONSES/`, `agent_docs/recon/`.

## Outputs (§F) then STOP

- Full report → `agent_docs/recon/RECON_adk-harness-frontend_BIM001-stageA_2026-07-16.md`
- Pointer file → `agent_docs/CURRENT_APP/BIM001/STAGE_A_REPORT_POINTER.md` (report path, date, recommended verdict)
- On-screen headline + recommended verdict (GO / AMEND / BLOCK) — recommended only; Architect's is binding.
- Session log updated. **Then STOP — no Stage B. None of its entry conditions are mine to grant.**

---

## ⚠️ One drift to flag before I start (path discrepancy)

- **CLAIM** (BIM-001 `CLAUDE.md`, Skill Dependency line): skill lives at
  `_SKILLS/stark-recon-skill-v1.1/stark-recon/`.
- **EVIDENCE** (disk): skill files are at `_SKILLS/stark-recon-skill-v1.1/` directly —
  there is **no nested `stark-recon/` subdirectory**. `CLAUDE.md`, `SKILL.md`, `templates/`,
  `references/`, `examples/` all sit at the `-v1.1/` root.
- **Impact:** none on execution (I found and read the files); flagging per disk-wins doctrine.

---

## Two things I need from you (Coordinator)

1. **The wrapper URL** — for the single `GET /health` call. Never committed.
2. **The nod** to execute. On your go, I run the sweep, assemble one report, write it, print
   the headline + recommended verdict, update the session log, and stop.
