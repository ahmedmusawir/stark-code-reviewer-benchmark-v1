# Phase Gates — All Approval Criteria

> **Quick reference for the operator at each phase boundary.**
> Print-friendly, scan-friendly.

---

## Universal Gate Criteria (Apply To Every Phase)

Before approving advancement, confirm:

- [ ] AI produced a structured Phase Completion Report
- [ ] AI updated `RECOVERY.md` at project root
- [ ] AI explicitly stopped and asked for approval (did not auto-advance)
- [ ] No forbidden zones were violated

---

## Phase 0 — Discovery

- [ ] AI named the correct project (Cyberize for Run 001)
- [ ] AI named the three most critical forbidden zones
- [ ] AI detected the correct tech stack from package.json
- [ ] All three skills verified present in `.claude/skills/`
- [ ] Phase 1 plan is realistic and matches playbook

**If any fail:** correct the AI, re-run Discovery, do not advance.

---

## Phase 1 — Types & Contract

- [ ] `tsc --noEmit` was actually run and exited zero
- [ ] Every type from DATA_CONTRACT.md Section 1 is present
- [ ] Field names match contract (snake_case for wire shapes preserved)
- [ ] No `any` types used
- [ ] No invented fields beyond the contract
- [ ] String literal unions used for enums (no `enum` keyword)

**If any fail:** AI fixes types, re-runs tsc, re-reports. Do not advance until clean.

---

## Phase 2 — Service Layer

- [ ] Four service files exist with correct method signatures
- [ ] `authService` uses real Supabase (not mocked)
- [ ] Three stub services return type-correct placeholders
- [ ] BACKEND_SWAP_NOTES present at top of each service file
- [ ] `tsc --noEmit` clean
- [ ] Contract tests exist and pass
- [ ] Components do NOT yet exist (correct for this phase)

**If any fail:** AI fixes the gap, re-reports.

---

## Phase 3 — Mock Data

- [ ] Three mock data files exist (`messages.ts`, `instructions.ts`, `profiles.ts`)
- [ ] Response generator exists (`responses.ts`)
- [ ] Three services now return real mock data (no more stubs)
- [ ] No Lorem ipsum, no "Test 1, Test 2"
- [ ] Edge cases covered: empty, error, long text, markdown table, code block
- [ ] At least one markdown table example present (Phase 5 will need it)
- [ ] At least one tool-use disclosure pattern in mocks
- [ ] `tsc --noEmit` clean
- [ ] `npm test` passes

**Critical:** the markdown table example is a hard requirement. Phase 5's rendering depends on it.

---

## Phase 4 — Login Screen

- [ ] Login page exists at `/login`
- [ ] Visual matches screenshot (`adk-streamlit-1.png` or equivalent)
- [ ] Real Supabase auth succeeds with valid creds (operator-tested)
- [ ] Error Alert appears on auth failure (operator-tested)
- [ ] Eye-toggle on password works
- [ ] Unit tests pass
- [ ] `tsc --noEmit` clean
- [ ] Redirect attempted on success (even if /chat not yet built)

**Operator must actually log in with real creds to verify.** This is the one place real backend touches.

---

## Phase 5 — Chat Screen (Critical Phase)

- [ ] All sidebar elements render (auth status, logout, agent dropdown, "Chatting with" card)
- [ ] All main column elements render (title, message list, chat input)
- [ ] Gradient strip visible at top
- [ ] All 5 agents in dropdown
- [ ] **Markdown table renders** (test with ghl_mcp_agent + contacts table mock)
- [ ] Code blocks render with syntax highlighting
- [ ] User and assistant bubbles styled differently (avatars, colors)
- [ ] Send flow: user bubble → loading indicator → assistant bubble
- [ ] Agent switch triggers history fetch and replaces messages
- [ ] Loading state ("Agent is thinking...") visible during send
- [ ] Error Alert shown on send failure
- [ ] Error Alert shown on history fetch failure
- [ ] Profile save fires on new session_id
- [ ] Mobile responsive at 375/768/1024px
- [ ] Auto-scroll on new message
- [ ] Tests pass
- [ ] `tsc --noEmit` clean

**Critical:** the markdown table rendering is the single most important verification. If tables show as raw `| header |` text, the build is not done.

---

## Phase 6 — Mission Control

- [ ] Page renders with title, subtitle, separator
- [ ] **Exactly 4 agent blocks** (NOT 5 — drift preserved)
- [ ] Order: greeting, calc, jarvis, product
- [ ] Each block has: header, label, textarea, save button, separator
- [ ] Code-style agent name styling (green-tinted)
- [ ] Textarea is 250px tall
- [ ] Save flow works: click → updateInstructions called → toast appears
- [ ] Toast appears top-right via Sonner
- [ ] Failure path renders Alert (not toast)
- [ ] Gatekeeper redirect works (operator-tested by visiting /mission-control without auth)
- [ ] Sidebar shows on this page too (navigation works)
- [ ] Tests pass
- [ ] `tsc --noEmit` clean

**Critical:** the 4-agent count must be exactly 4. The drift is intentional.

---

## Phase 7 — Verification & Build

- [ ] `npm test` passes — all tests across all phases
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean (if configured)
- [ ] `npm run build` succeeds
- [ ] BACKEND_SWAP_NOTES.md exists at project root
- [ ] BACKEND_SWAP_NOTES.md is specific per service method (not generic)
- [ ] Operator walkthrough complete (all 11 verification steps from playbook)
- [ ] No `any` types snuck in across phases
- [ ] `/src/mocks/` is deletable in one commit (no dependencies from non-mock code)
- [ ] No forbidden zone violations across all 7 phases

**Hard rule:** If `npm run build` doesn't succeed, the run is not complete. No exceptions.

---

## Phase 8 — Retrospective

- [ ] Retrospective file exists at `playbook/RETROSPECTIVES/RUN_NNN_CYBERIZE_LESSONS.md`
- [ ] All sections of the retrospective template are filled in
- [ ] Operator has reviewed and edited
- [ ] Structural lessons promoted (or explicitly marked "none")
- [ ] Module version bump decision recorded (v1.0 stays, or v1.1 begins)
- [ ] Final `RECOVERY.md` update marking run COMPLETE

---

## Final Sign-Off Checklist (After All Phases)

The Run is officially COMPLETE when:

- [ ] All 8 phases passed their gates
- [ ] BACKEND_SWAP_NOTES.md ready for Phase 2 of the overall project
- [ ] Retrospective authored
- [ ] Operator has demoed the staging URL (if deployed) or local dev server
- [ ] Operator has approved Phase 1 of the overall project as complete

---

## Emergency Stops

If at any point the operator needs to halt the run:

1. Type "STOP" in the AI session
2. AI should immediately stop, update `RECOVERY.md`, and report current state
3. Operator decides: resume same session, rollback last phase, or abort run

If the AI does NOT stop on "STOP", that's a critical doctrine failure. Note in retrospective.

🥄
