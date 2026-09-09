# CLAUDE.md — BIM-001 (Prove the Wire) — FINAL

> **You are reading the manager file for BIM-001.** Read this FIRST. Status: **FINAL — stamped 2026-07-16**, authored from the completed BIM-000 recon report (informed-state authoring per Lesson L1). This folder is **FROZEN from the moment the Engineer is launched** until he STOPs — nobody adds, edits, or replaces anything inside it while he holds the mandate (L1 Rule 2).

---

## Mission (one sentence)

Connect the Next.js frontend's chat domain to the live Python ADK wrapper on Cloud Run — through two new server-side proxy route handlers, behind a mode flag, with mock mode preserved one env flip away — running locally (`npm run dev`); no frontend deployment in this module.

## Roles

- **Tony (Coordinator):** launches, approves the plan after Architect QA, verifies the hero gates by hand, merges.
- **Jarvis (Architect):** authored this module from recon evidence; QAs the Engineer's plan before execution.
- **Claudy (Engineer — YOU):** Plan Mode first, always. Build only after plan approval.

## Ground truth this module stands on (no re-verification needed)

BIM-000's recon report (2026-07-16) verified: chatService signatures and SWAP_NOTES verbatim · all type shapes at cited lines · zero agent routes / mode flags / wrapper refs in src (greenfield seam) · forbidden zones exist as named · baseline 121/121 green, tsc clean, build clean · **wrapper healthy, 200, agent list == `AgentName` union exactly**. Re-verify wrapper health only if >48h have passed since the report (one `GET /health`).

## Decisions already ruled (baked in — do not re-open)

| # | Ruling |
|---|---|
| D1 | Error sentinel echoes the request's `session_id ?? ''` (Coordinator, 2026-07-16). No type changes needed; chatService-only. |
| AM-1 | Green board (G10) = `npm run build` + `npx tsc --noEmit` + full Jest suite. Lint is out (no ESLint config exists; `next lint` removed in Next 16). Lint tooling = future module. |
| AM-2 | Real wrapper URL never appears in any doc or commit — structural placeholders only. URL is supplied by the Coordinator in-session and lives in `.env.local` only. |
| Hosting | Out of scope — local dev only this module. |

## Folder Contents & Reading Order

| Order | File | What it is |
|---|---|---|
| 1 | `CLAUDE.md` | This manager |
| 2 | `MODULE_BRIEF.md` | Scope lock: what to build, forbidden zones, gates G1–G10 |
| 3 | `DATA_CONTRACT_AMENDMENT.md` | The seam, wire shapes, error contract (D1 resolved), env |

## Launch Procedure (Plan Mode — mandatory)

1. Read files 1→3.
2. Present your implementation plan in ONE message: exact file list created-vs-modified with one-line rationales · your D1(b) implementation sketch · test plan mapped to gates G2/G3/G7/G8/G10 · a step-by-step manual verification script for the Coordinator covering G4/G5/G6/G9 · confirmation of the regression rule (full suite before first change and after last).
3. **STOP. Do not write code.** The Coordinator relays your plan to the Architect for QA; you build only after the Coordinator says "plan approved."

## Definition of Done

All gates G1–G10 green (Brief §6) · full regression suite green · one commit per concern, `BIM-001`-tagged messages · changelog + session log updated per repo protocol · `RETROSPECTIVE.md` written by you into this folder at completion (the one sanctioned Engineer write here — what fought back, not just what worked; candidate lessons flagged for `agent_docs/LESSONS/`). Then the module closes and BIM-002 authoring may begin.

---

**Operator launch line (Tony, this is all you type):**
> *"Claudy — read `agent_docs/CURRENT_APP/BIM001/CLAUDE.md` and begin. Plan Mode."*

**Version 1.0-FINAL** · 2026-07-16 · Authored post-recon from BIM-000 evidence. Supersedes the retired draft Stage B files (see BIM-000 CLAUDE.md naming note).
