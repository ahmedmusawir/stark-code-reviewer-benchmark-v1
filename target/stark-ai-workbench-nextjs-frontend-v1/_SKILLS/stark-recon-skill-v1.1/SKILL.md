---
name: stark-recon
description: >
  Establish ground truth about a repo before any Architect authors a brief or FFM
  against it. The agent reads the filesystem, runs greps, and inspects build output
  to verify what docs CLAIM against what disk ACTUALLY contains, then produces a
  structured Recon Report. Use this skill at the START of any project, any phase,
  before authoring APP_BRIEF / DATA_CONTRACT / UI_SPEC / FFM files — and whenever
  significant work has landed since the last recon (phase closed, kit upgraded,
  branches merged). Triggers: "run a recon", "ground-truth the repo", "stark-recon",
  "verify before authoring", "what are we actually working with". Read-only of the
  inspected codebase (no source changes, no fixes, no git); the one write it makes is
  the Recon Report FILE — mandatory output, written to agent_docs/recon/, never
  on-screen only. This is NOT a deep architecture extraction (that is brain-drain, 11
  docs, hours) — recon is fast, targeted doc-vs-disk verification (one report, ~30
  min) focused on drift that would mislead authoring.
allowed-tools: [bash, view, create_file]
---

# Stark Recon

You are the **Engineer** running a ground-truth recon for the **Architect**. Your output is a **Recon Report** the Architect will author the next brief/FFM from. You verify; you do not fix. Where any doc and the filesystem disagree, the filesystem wins, and you flag the drift.

Read `CLAUDE.md` first (doctrine). Then execute the mission in `templates/RECON_MISSION.md`, answering in the format of `templates/RECON_REPORT_TEMPLATE.md`, labeling every finding per `references/EVIDENCE_DISCIPLINE.md`.

---

## The Recon Sequence

Six phases. Read-only throughout. Announce the scope, execute, assemble one report, STOP.

### Phase 0 — Day-0 Ground-Truth Sweep (run FIRST)

The highest-value drift, caught fastest. Per `RECON_MISSION.md` Section 0:
- Verify **every handbook-named file exists** on disk (the #1 lie class).
- Verify **handbook-claimed exports/shapes** match disk (`cat` the stores/utils the handbook describes; compare).
- Run the **forbidden-zone greps** against the kit itself, NOW (`: any`, `dangerouslySetInnerHTML`, `user_metadata.(is_|role)`).
- Verify **every doc-named route/path** by `find` before trusting it.
- Confirm the **test runner** (`grep -E '"test":|vitest|jest' package.json`).
- Ground-truth **env names** from the example file + `grep process.env` in code — never from docs.
- Run the **build route table** (`npm run build` output) — ground truth for what surfaces exist.

Every finding gets a label. Every doc-vs-disk mismatch gets flagged.

### Phase 1 — Stack & Structure

`RECON_MISSION.md` Sections 1-2: exact versions from `package.json` (Next, React, TS, Tailwind → token mechanic, Node pin, test runner, other heavyweights); kit structure vs handbook claims; existing directories (`src/services/`, `src/utils/`, `src/store/`, `src/types/`); route groups; `proxy.ts` vs `middleware.ts`.

### Phase 2 — Auth, Design & Data

`RECON_MISSION.md` Sections 3-5: the auth pattern (how user is read, how role resolves, whether a service layer exists, `user_metadata` role smells, route gates); design reality (token file + mechanic, numbered-color count, dark mode, font, theme toggle, CSS extension match, dark-mode real-screen note); database (migrations vs setup SQL, tables, enums, triggers/functions, RLS).

### Phase 3 — Scaffolding & Packaging

`RECON_MISSION.md` Sections 6, 8, 9: skills/security/env (skills dir + launch CWD, `npm audit`, required env vars, pointer files, boot check); demo/tutorial scaffolding + cross-project residue (the cascade trap + clone-debt fossils); FFM packaging & compile scope (`tsconfig` exclude, test-runner scope, `.ts` files that would compile).

### Phase 4 — Nav, Auth-State & Verification Predicates

`RECON_MISSION.md` Sections 11-12: nav variants present, theme-toggle-on-every-navbar, auth-state region on marketing routes, split-hero breakpoint; current state of every grep-verifiable predicate (numbered colors, `any`, role smells, forbidden directives).

### Phase 5 — Surprises & Report Assembly → WRITE TO FILE

`RECON_MISSION.md` Section 10 + 13: the open-ended sweep (orphans, latent kit-infra risks, stale docs, anything unexpected — **this is the gold**), the `src/` tree (2 levels), then assemble everything into the report format and write the **Recommendation to Architect** (verified facts the FFM can write against without re-verification; drift to surface in doctrine; cleanup candidates; open questions).

**Then WRITE THE REPORT TO A FILE — this is mandatory, not on-screen.** Create `agent_docs/recon/` if needed and write the full report to:
```
agent_docs/recon/RECON_<project>_<phase>_<YYYY-MM-DD>.md
```
On-screen, print ONLY: a one-line "Recon complete", the file path, and a 3-5 line headline summary (biggest drifts + top surprises). The full report lives in the file.

STOP. Hand the Architect the file path.

---

## Worked Example

See `examples/cyber-pharma-v1-phase2-recon-2026-06-08.md` — a real pre-authoring recon that confirmed a repo's post-Phase-1 state. Note how it: leads with the Day-0 sweep, labels findings, flags every doc-vs-disk drift (handbook still says Vitest/ThemeToggle/AppShellPage; APP_BRIEF still names legacy env vars), surfaces real orphans in the Surprises section (a leftover `SuperadminSidebar.tsx`, an unimported `command.tsx` with `as any`), and closes with a Recommendation listing exactly what the Architect can write against vs. what to re-confirm.

That report is the shape. Match it.

---

## Anti-Patterns (Block These)

See `references/ANTI_PATTERNS.md` for detail. Summary:
- ❌ Trusting a doc claim without verifying on disk → the entire reason this skill exists.
- ❌ Fixing defects during recon → recon REPORTS, never patches. Fixing is a separate authorized pass.
- ❌ Skipping the Surprises section → that's where the next unknown lesson lives.
- ❌ Unlabeled findings → the Architect can't tell verified from guessed.
- ❌ Mutating anything / running git → read-only, always.
- ❌ Trickling findings instead of one assembled report.
- ❌ Treating recon as brain-drain → recon is fast/targeted doc-vs-disk; brain-drain is deep architecture extraction. Don't write 11 docs.

---

## When You're Done

- Every mission section answered from disk (or explicitly marked N/A per Operator override).
- Every finding labeled. Every doc-vs-disk drift flagged.
- The Surprises section populated (orphans, latent risks, stale docs).
- The Recommendation to Architect written: verified-facts / doctrine-drift / cleanup-candidates / open-questions.
- **The full report WRITTEN TO A FILE** at `agent_docs/recon/RECON_<project>_<phase>_<YYYY-MM-DD>.md` — NOT on-screen only.
- On-screen: one-line confirmation + the file path + a 3-5 line headline. STOP. No source changes. No git.

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-06-08 | Initial methodology. Six-phase sequence over the 13-section mission, seeded from the Cyber Pharma v1 Phase 1 run. |
| 1.1 | 2026-06-09 | Phase 5 now writes the report to a file (mandatory). allowed-tools includes create_file. |
