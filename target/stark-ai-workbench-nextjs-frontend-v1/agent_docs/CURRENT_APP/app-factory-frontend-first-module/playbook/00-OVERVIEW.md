# Playbook Overview

> **The phase-by-phase build plan.**
> Read in order. Don't skip. Don't reorder.

---

## Phase Model

This module operates in **supervised autonomy** mode:

- Inside a phase, the AI tool works independently — writes files, runs tests, fixes failures, iterates
- At phase boundaries, the AI tool STOPS, reports, and waits for operator approval before advancing
- Each phase has explicit success criteria in `../verification/PHASE_GATES.md`

There are nine phases total (Phase 0 plus eight build phases). Most runs complete in half a day to one day of focused work.

---

## Phase Index

| # | File | Phase | What Gets Built | AI Time | Review Time |
|---|---|---|---|---|---|
| 0 | `01-DISCOVERY.md` | Discovery | Understanding + Phase 0 plan | 10-15 min | 5-10 min |
| 1 | `02-TYPES.md` | Types & Contract | `/src/types/` | 15-30 min | 10 min |
| 2 | `03-SERVICES.md` | Service Layer | `/src/services/` stubs | 20-40 min | 10 min |
| 3 | `04-MOCKS.md` | Mock Data | `/src/mocks/` | 20-30 min | 10 min |
| 4 | `05-LOGIN.md` | Login Screen | Real auth wired | 30-45 min | 15 min |
| 5 | `06-CHAT.md` | Chat Screen | Sidebar + messages + input | 60-90 min | 20 min |
| 6 | `07-MISSION-CONTROL.md` | Mission Control | Per-agent edit blocks | 30-45 min | 15 min |
| 7 | `08-VERIFICATION.md` | Verification & Build | Tests + npm build + walkthrough | 15-30 min | 15 min |
| 8 | `09-RETROSPECTIVE.md` | Retrospective | Lessons doc draft | 15-20 min | 30 min |

**Total estimated:** 3-5 hours of AI generation + 1.5-2 hours of operator review = half to one day end-to-end.

---

## Universal Phase Discipline

These rules apply WITHIN every phase, automatically. The AI tool doesn't need re-permission to follow them:

### Within-Phase Behavior

- Write code in small commits (per logical unit)
- Run tests after each significant change
- Fix failing tests before moving on (do NOT weaken tests to make them pass)
- Update RECOVERY.md if anything significant changes mid-phase
- Surface (not silently resolve) any ambiguity that would require a doctrine choice

### Phase Boundary Behavior (MANDATORY STOP)

At the end of every phase, the AI tool produces a **Phase Completion Report**:

```
## Phase N Complete

### Completed
- [bullet list of files created or modified]
- [tests added and passing]

### Verified
- [each item from the phase's verification checklist with ✅ or ⚠️]

### Concerns
- [anything that surprised, anything ambiguous, anything skipped]

### Next Phase
- [Phase N+1 name]
- [proposed first 2-3 actions]

### Awaiting Approval
Ready to proceed? Type "approved" or specify changes.
```

The AI tool then STOPS and waits. Does not proceed to the next phase until the operator types "approved" or equivalent.

---

## Recovery Protocol

If a session is interrupted, the AI tool resumes by:

1. Reading `RECOVERY.md` at the starter kit project root
2. Reading the current phase's playbook file
3. Re-reading any files mentioned as "in progress" in RECOVERY.md
4. Proposing to the operator: "Last phase completed: X. Current phase: Y, mid-step Z. Proposed continuation: ..."
5. Awaiting approval before resuming

`RECOVERY.md` is updated by the AI tool at the end of every phase, and ideally after each significant within-phase step.

---

## Skill Activation Per Phase

The `stark-frontend-first` skill is active throughout. The Anthropic-official skills activate as needed:

| Phase | Custom Skill | Anthropic Skills Likely To Trigger |
|---|---|---|
| 0 Discovery | stark-frontend-first | none |
| 1 Types | stark-frontend-first | none |
| 2 Services | stark-frontend-first | none |
| 3 Mocks | stark-frontend-first | none |
| 4 Login | stark-frontend-first | frontend-design |
| 5 Chat | stark-frontend-first | frontend-design |
| 6 Mission Control | stark-frontend-first | frontend-design |
| 7 Verification | stark-frontend-first | none |
| 8 Retrospective | stark-frontend-first | skill-creator (if proposing new skills) |

---

## Tests Per Phase

Unit tests are written DURING the phases where they belong, not deferred to the end:

| Phase | Tests Added |
|---|---|
| 1 Types | none (types compile-checked instead) |
| 2 Services | service contract tests (each method returns correct shape) |
| 3 Mocks | mock data validation (each mock satisfies its type) |
| 4 Login | LoginForm component tests, authService integration test |
| 5 Chat | MessageBubble, AgentSelector, ChatInput, message flow integration |
| 6 Mission Control | InstructionBlock, save-flow integration |
| 7 Verification | full test suite run, npm build, integration walkthrough |

**No E2E tests in Run 001.** Deferred per operator decision.

**Testing framework:** Vitest (assumed pre-wired in starter kit; verify in Phase 0).

---

## Files Created Per Phase (Summary Map)

| Phase | Files |
|---|---|
| 1 | `src/types/index.ts` (or per-entity files) |
| 2 | `src/services/{authService,chatService,profileService,instructionsService}.ts` |
| 3 | `src/mocks/data/{messages,instructions,profiles}.ts`, `src/mocks/responses.ts` |
| 4 | `src/app/login/page.tsx`, `src/components/auth/LoginForm.tsx`, related tests |
| 5 | `src/app/chat/page.tsx`, `src/components/chat/*.tsx`, `src/stores/chatStore.ts`, tests |
| 6 | `src/app/mission-control/page.tsx`, `src/components/mission-control/*.tsx`, tests |
| 7 | `BACKEND_SWAP_NOTES.md` at project root, any verification fixes |
| 8 | `playbook/RETROSPECTIVES/RUN_001_CYBERIZE_LESSONS.md` |

---

## How To Use This Playbook

**For the AI tool:**
- Read this overview first
- Read the current phase's file when entering that phase
- Follow the steps within the phase autonomously
- Stop at the phase boundary, produce the completion report, wait for approval

**For the operator:**
- Read this overview to know what's coming
- Use `../verification/PHASE_GATES.md` to evaluate completion reports
- Approve, correct, or roll back at each boundary

---

## Closing

This playbook is **doctrine, not a script**. The AI tool uses judgment within each phase. The phase boundaries are the discipline points.

By Run 003 or 004, this playbook should be tight enough to support fully autonomous overnight execution. For Run 001, supervised autonomy is the right cautious step.

🥄
