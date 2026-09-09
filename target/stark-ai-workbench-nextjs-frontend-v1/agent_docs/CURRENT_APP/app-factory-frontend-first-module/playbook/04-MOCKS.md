# Phase 3 — Mock Data

> **Goal:** Author realistic mock data in `/src/mocks/` and wire it into the stub services.
> **AI time:** 20-30 min | **Review time:** 10 min
> **Pre-req:** Phase 2 approved

---

## What This Phase Does

Mock data drives the UI for all of Phase 1. It must:
- Match types exactly
- Feel realistic (no Lorem ipsum)
- Cover happy path + edge cases + error states
- Be deletable in one commit when Phase 2 (overall project) begins backend swap

By end of phase, the three stub services return real-feeling data and the UI in Phase 4-6 will look populated.

---

## Steps

### Step 1 — Read DATA_CONTRACT.md Section 3

Section 3 specifies:
- Five mock agents
- Per-agent instruction examples (referencing screenshots in `_design/`)
- Per-agent message patterns (the ghl_mcp_agent contacts table is canonical)
- Edge case coverage requirements

### Step 2 — Create Mock Data Files

Create in `src/mocks/data/`:
- `messages.ts` — message histories per session
- `instructions.ts` — agent instruction blobs (5 agents for chat dropdown; 4 used by Mission Control per drift)
- `profiles.ts` — user profile rows with agent_sessions maps

Use the template at `skills/stark-frontend-first/templates/mock-data.template.ts` for the file shape.

### Step 3 — Author Realistic Instruction Text

Each agent gets an instruction blob in `instructions.ts`:
- `greeting_agent` — friendly + resume_reader_tool reference (match screenshot `adk-streamlit-3.png`)
- `jarvis_agent` — JARVIS persona + google_search + English (match screenshot `adk-streamlit-2.png`)
- `calc_agent` — Rico the calculator + code execution + memory (match screenshot `adk-streamlit-2.png`)
- `product_agent` — invent a realistic product-assistant persona
- `ghl_mcp_agent` — contacts/MCP tool persona (match screenshot `adk-streamlit-4.png`)

### Step 4 — Author Realistic Message Histories

For each agent, seed 2-4 messages per session showing varied content. Must include at least one example of:
- Plain text exchange
- Markdown formatting (bold, italic, lists)
- Code block
- **Markdown table** (critical — the ghl_mcp_agent contacts table from screenshot `adk-streamlit-4.png` is the canonical test case)
- Tool-use disclosure pattern (`Tool I'm using: X | Reason: Y` — from screenshot)

### Step 5 — Author Mock Response Generator

Create `src/mocks/responses.ts` with a function that generates a plausible RunAgentResponse for any sent message:
- Echoes user message in the agent's voice
- `calc_agent` returns math-like responses
- `jarvis_agent` responds formally ("sir", "Mr. Stark")
- `ghl_mcp_agent` occasionally returns markdown table responses
- `greeting_agent` returns friendly conversational replies
- First message in a session generates a new `session_id` (e.g., `mock-session-${Date.now()}`)
- Subsequent messages return same `session_id`

### Step 6 — Wire Mocks Into Services

Update `chatService`, `profileService`, `instructionsService` to import from `/src/mocks/` and return real mock data instead of placeholders. Method signatures stay identical — only the bodies change.

Pattern (reference SERVICE_LAYER_PATTERNS.md):
```typescript
import { messages as mockMessages } from '@/mocks/data/messages';
// ...
getHistory: async (input) => {
  await new Promise(r => setTimeout(r, 300));
  return mockMessages.filter(m => m.sessionId === input.session_id);
},
```

### Step 7 — Verify

```bash
npx tsc --noEmit
npm test
```

Both must exit zero. Mock data must satisfy types exactly.

### Step 8 — Edge Case Coverage Audit

Confirm coverage:
- [ ] At least one empty state demo (empty array return)
- [ ] At least one error state path (mock throws on a specific trigger)
- [ ] At least one long text edge case
- [ ] At least one markdown table example
- [ ] At least one code block example
- [ ] No Lorem ipsum, no "Test 1, Test 2"

### Step 9 — Phase Completion Report

```
## Phase 3 Complete — Mock Data

### Completed
- Created: src/mocks/data/messages.ts (N sessions, M messages total)
- Created: src/mocks/data/instructions.ts (5 agent instruction blobs)
- Created: src/mocks/data/profiles.ts (mock user profile rows)
- Created: src/mocks/responses.ts (response generator)
- Updated: chatService, profileService, instructionsService now return real mock data

### Verified
- ✅ tsc --noEmit clean
- ✅ npm test passes
- ✅ All mocks satisfy types from src/types/
- ✅ Realistic data — no Lorem ipsum
- ✅ Edge cases covered (empty, error, long, table, code)
- ✅ Tool-use disclosure pattern present in at least one mock message

### Concerns
- [list any]

### Next Phase
- Phase 4: Login Screen
- Proposed actions:
  - Create src/app/login/page.tsx
  - Create src/components/auth/LoginForm.tsx
  - Wire to real authService (Supabase)
  - Unit tests for LoginForm

### Awaiting Approval
```

### Step 10 — Update RECOVERY.md and Stop

---

## Verification Gate

- [ ] Three mock data files exist with realistic data
- [ ] Response generator exists
- [ ] Three services now return real mock data
- [ ] tsc clean
- [ ] Tests pass
- [ ] Edge cases covered
- [ ] Markdown table example present (critical for Phase 5)

---

## Anti-Patterns To Avoid

- ❌ Lorem ipsum or "Test 1, Test 2" filler
- ❌ Mock data that doesn't match types
- ❌ Missing the markdown table example (Phase 5 needs it for rendering verification)
- ❌ Mocks imported directly by components (only services touch mocks)
- ❌ Putting mock data in component files
