# Phase 6 — Mission Control Screen

> **Goal:** Build the Mission Control screen with per-agent instruction blocks, save flow, and gatekeeper redirect.
> **AI time:** 30-45 min | **Review time:** 15 min
> **Pre-req:** Phase 5 approved

---

## What This Phase Does

Second authenticated page. Tests:
- Repeating-block component pattern (4 identical agent blocks)
- Textarea + Save button per block
- Success toast via Shadcn Sonner
- Error Alert for save failures
- Gatekeeper redirect for unauthenticated users
- Loading state for initial instruction fetch (4 sequential reads)

---

## Steps

### Step 1 — Read UI_SPEC.md Section 5

Section 5 is the Mission Control screen spec. Note the hardcoded 4-agent list (NOT 5 — the drift is preserved per APP_BRIEF Section 10).

### Step 2 — Reference Screenshots

- `adk-streamlit-2.png` — Mission Control with calc_agent block AND success toast visible
- `adk-streamlit-3.png` — Mission Control top showing greeting_agent block

### Step 3 — Create Files

- `src/app/mission-control/page.tsx` — the route
- `src/components/mission-control/AgentInstructionBlock.tsx` — one repeating block
- `src/components/mission-control/SaveButton.tsx` — button with loading state (optional, can be inline in block)
- Test files for the components

### Step 4 — Build AgentInstructionBlock

Per UI_SPEC.md Section 5.3:

Elements per block:
- Section header: `Instructions for: <code>{agent_name}</code>` (green-tinted code style)
- Label: `Modify instructions:`
- Textarea: 250px tall, value from `fetchInstructions(agent)`, keyed by `${agent}_textarea`
- Button: `Save for {agent_name}` (outline variant)
- Separator below

On mount: call `instructionsService.fetchInstructions(agent)` for THIS agent only.

On save click:
1. Get current textarea value
2. Call `instructionsService.updateInstructions(agent, value)`
3. On success: trigger `toast.success` via Sonner
4. On failure: render Alert below button

### Step 5 — Build The Mission Control Page

Per UI_SPEC.md Section 5.1:

```typescript
const MISSION_CONTROL_AGENTS = ['greeting_agent', 'calc_agent', 'jarvis_agent', 'product_agent'] as const;
// Note: ghl_mcp_agent is NOT in this list (drift preserved from original)
```

Page structure:
1. Page title: `🎛️ Mission Control`
2. Subtitle: `Update agent instructions in real-time.`
3. Separator
4. Map over `MISSION_CONTROL_AGENTS`, render an `AgentInstructionBlock` for each

### Step 6 — Auth Gate

For Run 001, use **Option B from UI_SPEC.md Section 5.7**: redirect unauthenticated users to `/login` via middleware. Document this as a deliberate divergence in the BACKEND_SWAP_NOTES.

(Alternative: render the inline alerts if you prefer faithful behavior — operator's call. Default recommendation: redirect.)

### Step 7 — Toast Setup

Verify Shadcn Sonner is installed. If not, add it via `npx shadcn@latest add sonner`.

Add `<Toaster />` to the root layout (or the mission-control layout) so toasts render globally.

### Step 8 — Write Tests

- `AgentInstructionBlock.test.tsx`:
  - Renders with loading state initially
  - Shows fetched instructions after load
  - Save button calls updateInstructions with current textarea value
  - Success path triggers toast
  - Failure path renders error Alert
- Integration test for the page:
  - Renders 4 blocks (not 5 — drift preserved)
  - Each block in correct order: greeting, calc, jarvis, product

Run:
```bash
npm test
```

### Step 9 — Verify

```bash
npx tsc --noEmit
npm test
npm run dev  # operator manually verifies
```

Operator walks through:
1. From chat sidebar, click Mission Control link
2. Page loads with 4 agent blocks (verify 4, not 5)
3. Each block shows current (mocked) instructions
4. Edit greeting_agent's textarea
5. Click Save for greeting_agent
6. Toast appears top-right: `Success! Instructions for greeting_agent updated.`
7. Try saving with mock failure trigger (if implemented) — verify Alert appears
8. Logout, then navigate directly to /mission-control URL
9. Verify redirect to /login

### Step 10 — Phase Completion Report

```
## Phase 6 Complete — Mission Control

### Completed
- Created: src/app/mission-control/page.tsx
- Created: src/components/mission-control/AgentInstructionBlock.tsx
- Created: tests for above
- Auth gate: middleware redirects unauth users to /login
- Toast: Sonner configured

### Verified
- ✅ tsc --noEmit clean
- ✅ npm test passes
- ✅ Page renders matching screenshots adk-streamlit-2.png and adk-streamlit-3.png
- ✅ Exactly 4 agent blocks (ghl_mcp_agent omitted — drift preserved)
- ✅ Order: greeting, calc, jarvis, product
- ✅ Save flow works (operator-verified)
- ✅ Toast appears on success
- ✅ Alert appears on failure
- ✅ Gatekeeper redirect works (operator-verified)

### Concerns
- [list any]

### Next Phase
- Phase 7: Verification & Build
- Proposed actions:
  - Full test suite run
  - npm run build verification
  - Full screen walkthrough
  - BACKEND_SWAP_NOTES.md authored at project root

### Awaiting Approval
```

### Step 11 — Update RECOVERY.md and Stop

---

## Verification Gate

- [ ] Page renders matching screenshots
- [ ] 4 blocks (NOT 5 — drift preserved)
- [ ] Correct order: greeting, calc, jarvis, product
- [ ] Save flow works
- [ ] Toast on success
- [ ] Alert on failure
- [ ] Gatekeeper redirect works
- [ ] Tests pass
- [ ] tsc clean

---

## Anti-Patterns To Avoid

- ❌ Adding ghl_mcp_agent to Mission Control "to fix the drift" — preserve it
- ❌ Reordering the agents — keep greeting/calc/jarvis/product order from original
- ❌ Showing toast for failure — use Alert for failure (matches original: toast=success, alert=failure)
- ❌ Forgetting Sonner setup — toasts won't render
- ❌ Skipping the gatekeeper test path
