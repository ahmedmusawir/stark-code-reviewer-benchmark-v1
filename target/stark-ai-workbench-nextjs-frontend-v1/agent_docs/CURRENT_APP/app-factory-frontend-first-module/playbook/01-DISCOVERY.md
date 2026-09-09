# Phase 0 — Discovery

> **Goal:** AI tool reads everything, summarizes back, proposes Phase 1 plan.
> **AI time:** 10-15 min | **Review time:** 5-10 min

---

## What This Phase Does

Before any code is written, the AI tool must demonstrate it understands:
- What this project is
- What's in scope and out of scope
- What the data shapes are
- What the screens look like
- What the forbidden zones are

This phase produces no code. It produces an acknowledgment that proves the AI is oriented.

---

## Steps

### Step 1 — Read The Navigation

In order:
1. `../CLAUDE.md` (module root) — re-read for full doctrine
2. `../_project/CLAUDE.md` — project-specific spine
3. `../_project/APP_BRIEF.md` — scope and gates
4. `../_project/DATA_CONTRACT.md` — data shapes
5. `../_project/UI_SPEC.md` — screen behavior

### Step 2 — Inspect The Starter Kit

At the starter kit project root (where the AI is running):
- Read root `CLAUDE.md` — note its conventions
- Inspect `src/` structure — what's already built
- Inspect `package.json` — what's installed (Next.js version, Shadcn, Zustand, Vitest, etc.)
- Inspect `.claude/skills/` — verify three skills present: `frontend-design`, `skill-creator`, `stark-frontend-first`
- Read `RECOVERY.md` if it exists — note any prior state

### Step 3 — Reference Material (Skim)

- Glance at `../_design/` — note what screenshots exist
- Glance at `../_extraction/` — note which docs exist (don't read all 11 deeply yet; reference on demand)
- Read `../skills/stark-frontend-first/CLAUDE.md` and `SKILL.md` — the skill's full doctrine

### Step 4 — Produce The Acknowledgment

Output a structured summary in this format:

```
## Phase 0 Discovery Complete

### Project Identity
- Name: [from APP_BRIEF section 1]
- Origin: [source app being converted]
- Phase: Frontend-First (Phase 1 of 4 overall)

### Scope Summary (3-5 bullets)
- [bullet 1]
- [bullet 2]
- [...]

### Three Most Critical Forbidden Zones
1. [zone 1 — usually "no backend code authoring"]
2. [zone 2 — usually "no real external API calls except auth"]
3. [zone 3 — usually "no improvements / faithful conversion only"]

### Stack Detected
- Framework: [e.g., Next.js 15]
- UI: Shadcn + Tailwind
- State: Zustand
- Auth: Supabase (real, via starter kit)
- Markdown: react-markdown + remark-gfm
- Tests: Vitest

### Skill Stack Verified
- ✅ frontend-design (Anthropic)
- ✅ skill-creator (Anthropic)
- ✅ stark-frontend-first (custom)

### Proposed Phase 1 Plan
- Create `src/types/index.ts` (or per-entity files)
- Author every type from DATA_CONTRACT.md Section 1
- Run `tsc --noEmit` to verify clean compilation
- Files I will create: [list]
- Files I will NOT touch: backend, services, components, mocks (next phases)

### Awaiting Approval
Ready to proceed to Phase 1? Type "approved" or specify changes.
```

### Step 5 — Stop

Do not proceed. Wait for the operator's "approved" or correction.

---

## Verification Gate

The operator confirms BEFORE giving approval:

- [ ] AI named the correct project (Cyberize Agentic Automation for Run 001)
- [ ] AI named the three most critical forbidden zones correctly
- [ ] AI detected the right tech stack from `package.json`
- [ ] All three skills verified in `.claude/skills/`
- [ ] Phase 1 plan is realistic and matches the playbook

If any item fails, the operator corrects the AI before approving. The AI does not advance until all items pass.

---

## Common Stumbles

- AI tries to write code in Phase 0 → STOP. This phase is read-only.
- AI summarizes wrong scope → re-read `_project/APP_BRIEF.md` Section 5 and 6
- AI doesn't find the skills → verify `.claude/skills/` path is correct, restart Claude if needed
- AI confuses module CLAUDE.md with project CLAUDE.md → re-read both carefully, they have different purposes
