# Phase 7 — Verification & Build

> **Goal:** Full test suite green, `npm run build` clean, operator walkthrough of every screen, BACKEND_SWAP_NOTES.md authored.
> **AI time:** 15-30 min | **Review time:** 15 min
> **Pre-req:** Phase 6 approved

---

## What This Phase Does

The final gate before declaring Phase 1 of the overall project complete. No new features. Just verification, build, documentation of what the next phase (real backend wiring) needs to know.

---

## Steps

### Step 1 — Full Test Suite

```bash
npm test
```

Must exit zero. All tests across all phases must pass.

If any test fails:
- Do NOT weaken the test to make it pass (Karpathy Rule 9 — tests verify intent)
- Investigate the failure
- Fix the implementation, not the test
- If unsure, surface to operator

### Step 2 — TypeScript Compilation

```bash
npx tsc --noEmit
```

Must exit zero. Zero errors. No `any` types snuck in. No unused imports if your config flags them.

### Step 3 — Lint (If Configured)

```bash
npm run lint
```

If a lint script is in package.json, must exit zero. If no lint script, skip.

### Step 4 — Production Build

```bash
npm run build
```

Must complete successfully. No errors, no warnings about missing exports, no build-time crashes.

If build fails:
- Read the error
- Fix the underlying issue
- Do not work around by disabling checks
- If genuinely stuck, surface to operator

### Step 5 — Author BACKEND_SWAP_NOTES.md

Create at the starter kit project root. This is the handoff document for Phase 2 of the overall project (when Stark wires real backends).

Template:

```markdown
# Backend Swap Notes — Phase 2 Handoff

## Overview

This document lists every service method in the frontend that currently uses mock data, along with the real backend wiring needed in Phase 2.

## Service-By-Service

### authService
**Status:** Already real (Supabase via starter kit). No swap needed.

### chatService

#### sendMessage
- Currently: Returns mock response from mocks/responses.ts
- Phase 2: POST {WRAPPER_URL}/run_agent
- Timeout: 90 seconds
- Auth: [decide — currently Streamlit sends no auth header]
- Request body: { agent_name, message, user_id, session_id (nullable) }
- Response: { response, session_id }

#### getHistory
- Currently: Returns mock messages from mocks/data/messages.ts
- Phase 2: POST {WRAPPER_URL}/get_history
- Timeout: 30 seconds
- Auth: [decide]
- Request body: { agent_name, user_id, session_id }
- Response: { history: [{ role, content }] }

### profileService

#### fetchProfile
- Currently: Returns mock profile from mocks/data/profiles.ts
- Phase 2: supabase.from('adk_n8n_hybrid_profiles').select('agent_sessions').eq('id', userId)
- RLS: assumed; verify policies exist

#### saveProfile
- Currently: In-memory or localStorage
- Phase 2: supabase.from('adk_n8n_hybrid_profiles').upsert({ id, agent_sessions })

### instructionsService

#### fetchInstructions
- Currently: Returns mock from mocks/data/instructions.ts
- Phase 2 DECISION POINT: Direct GCS via Next.js API route (service account), OR new wrapper endpoint?
- See extraction _extraction/10-RAW-FINDINGS-AND-QUESTIONS.md F7

#### updateInstructions
- Currently: Updates in-memory or localStorage
- Phase 2: Same decision as above

## Known Discrepancies Preserved From Original

(Copy from APP_BRIEF.md Section 10)

## Phase 2 Decision Checklist

(Copy from DATA_CONTRACT.md Section 5)

## Phase 3 Considerations

- Wrapper-to-Next.js-API migration is optional
- If chosen, every chatService method becomes an internal API route call
- Mission Control likely benefits from a wrapper endpoint (Phase 2 decision)
```

### Step 6 — Operator Walkthrough

Operator runs:

```bash
npm run dev
```

And walks through:
1. Land on root URL → redirects to /login
2. Login with real Supabase creds → redirects to /chat
3. Verify all 5 agents in dropdown
4. Switch agents → history loads/changes
5. Send messages → user + assistant bubbles
6. Verify markdown table renders (ask ghl_mcp_agent for contacts)
7. Navigate to Mission Control → 4 agent blocks
8. Edit an instruction, save → toast appears
9. Logout → redirects to login
10. Try /mission-control directly without auth → redirects to login
11. Resize browser to mobile width → layout adapts

### Step 7 — Phase Completion Report

```
## Phase 7 Complete — Verification & Build

### Completed
- BACKEND_SWAP_NOTES.md authored at project root

### Verified
- ✅ npm test passes (N total tests across all phases)
- ✅ npx tsc --noEmit clean
- ✅ npm run lint clean (if configured)
- ✅ npm run build succeeds
- ✅ Operator walkthrough: all 11 verification steps pass
- ✅ BACKEND_SWAP_NOTES.md present and complete

### Concerns
- [any build warnings worth noting]
- [any walkthrough findings]

### Next Phase
- Phase 8: Retrospective
- Proposed actions:
  - Author RUN_001_CYBERIZE_LESSONS.md in playbook/RETROSPECTIVES/
  - Capture: where I stumbled, where the doctrine was thin, what I'd improve
  - Propose module updates for v1.1

### Awaiting Approval
```

### Step 8 — Update RECOVERY.md and Stop

---

## Verification Gate

- [ ] Full test suite passes
- [ ] tsc clean
- [ ] Build succeeds
- [ ] BACKEND_SWAP_NOTES.md exists and complete
- [ ] Operator walkthrough complete
- [ ] No forbidden zone violations across all phases

---

## Anti-Patterns To Avoid

- ❌ Disabling tests or types to make verification pass
- ❌ "It works on my machine" — must actually `npm run build`
- ❌ Skipping the operator walkthrough
- ❌ Generic BACKEND_SWAP_NOTES — must be specific per service method
- ❌ Declaring done with known bugs unflagged
