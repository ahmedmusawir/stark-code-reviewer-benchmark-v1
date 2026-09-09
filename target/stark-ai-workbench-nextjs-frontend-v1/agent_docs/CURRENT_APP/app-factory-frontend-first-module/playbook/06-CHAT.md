# Phase 5 — Chat Screen (Biggest Phase)

> **Goal:** Build the Chat screen with sidebar, agent selector, message list with markdown rendering, chat input, and all state transitions.
> **AI time:** 60-90 min | **Review time:** 20 min
> **Pre-req:** Phase 4 approved

---

## What This Phase Does

The most complex screen. Tests:
- App shell layout with sidebar + main column + gradient strip
- Agent dropdown with session state
- Message list with markdown rendering INCLUDING tables (critical)
- Chat input with submit, sticky bottom positioning
- Loading state ("Agent is thinking...")
- Agent-switch history fetch
- All error states (history fetch fail, send fail, profile save fail)
- Zustand store for cross-component state

---

## Steps

### Step 1 — Read UI_SPEC.md Section 4 (and Section 2 for layout, Section 6 for cross-cutting)

Section 4 is the Chat screen. Section 2 is the global layout (sidebar + main). Section 6 covers markdown rendering rules, loading states, error patterns, auto-scroll.

### Step 2 — Reference Screenshots

- `adk-streamlit-4.png` — chat with ghl_mcp_agent and contacts table (markdown table critical)
- `adk-streamlit-5.png` — chat with jarvis_agent, dropdown open showing all 5 agents
- `adk-streamlit-6.png` — chat with greeting_agent, casual reply

### Step 3 — Build Layout Components First

Order matters — layout before content.

- `src/components/layout/GradientStrip.tsx` — the rainbow strip at top
- `src/components/layout/Sidebar.tsx` — using Shadcn Sidebar primitive
- `src/components/layout/AppShell.tsx` — composes GradientStrip + Sidebar + main slot
- `src/app/layout.tsx` — root layout that uses AppShell

### Step 4 — Build Zustand Store

Create `src/stores/chatStore.ts` with the shape from UI_SPEC.md Section 4.9:

```typescript
interface ChatStore {
  selectedAgent: AgentName;
  lastSelectedAgent: AgentName | null;
  messages: Message[];
  agentSessions: AgentSessionMap;
  isLoading: boolean;
  // setters...
}
```

### Step 5 — Build Chat Components

Build incrementally. Run tests after each component.

Order:
1. **`AgentSelector.tsx`** — sidebar dropdown using Shadcn Select. Pulls 5 agents.
2. **`ChattingWithCard.tsx`** — blue-tinted card below dropdown showing selected agent
3. **`MessageBubble.tsx`** — variants for user (red avatar) and assistant (orange avatar). Markdown rendering for assistant.
4. **`MessageList.tsx`** — Shadcn ScrollArea wrapping bubbles. Auto-scroll to bottom on new message.
5. **`ThinkingIndicator.tsx`** — "Agent is thinking..." with spinner
6. **`ChatInput.tsx`** — sticky bottom input with send button

### Step 6 — Markdown Rendering (CRITICAL)

In `MessageBubble.tsx` for the assistant variant:

```typescript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// ...
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    code: ({ inline, ...props }) => /* syntax highlight if block, plain if inline */,
    table: ({ children }) => <table className="my-2 w-full text-sm">{children}</table>,
    // ... other custom renderers
  }}
>
  {content}
</ReactMarkdown>
```

The contacts table from `adk-streamlit-4.png` is the canonical test. If that renders correctly, markdown is wired right.

### Step 7 — Build The Chat Page

`src/app/chat/page.tsx`:
- Server component shell
- Client component child that uses the store
- Fetch initial profile on mount (call `profileService.fetchProfile`)
- Handle agent switching (call `chatService.getHistory` on change)
- Handle message send (call `chatService.sendMessage`)
- Persist session_id changes (call `profileService.saveProfile`)

### Step 8 — Auth Gate

Add middleware or layout-level check to redirect unauthenticated users to `/login`. Use the starter kit's existing auth helpers.

### Step 9 — Write Tests

Per-component unit tests:
- `AgentSelector.test.tsx` — renders all 5 agents, calls setSelectedAgent on change
- `MessageBubble.test.tsx` — renders user vs assistant variants, renders markdown including tables
- `MessageList.test.tsx` — renders array of messages, scrolls on new message
- `ChatInput.test.tsx` — calls submit on Enter, clears input after submit
- Integration test for the page: send message → user bubble appears → loading shows → assistant bubble appears

Run:
```bash
npm test
```

### Step 10 — Verify

```bash
npx tsc --noEmit
npm test
npm run dev  # operator manually verifies
```

Operator walks through:
1. Lands on chat after login
2. Sees default agent in dropdown
3. Switches to ghl_mcp_agent
4. Sees contacts table render (markdown table works)
5. Sends a message
6. Sees user bubble immediately
7. Sees "Agent is thinking..." loading
8. Sees assistant bubble with mock response
9. Switches agents — sees history change
10. Logs out — redirects to login

### Step 11 — Phase Completion Report

```
## Phase 5 Complete — Chat Screen

### Completed
- Layout: GradientStrip, Sidebar, AppShell, root layout
- Store: chatStore (Zustand)
- Components: AgentSelector, ChattingWithCard, MessageBubble, MessageList, ThinkingIndicator, ChatInput
- Page: src/app/chat/page.tsx
- Tests: N new test files
- Auth gate: middleware/layout redirect to /login

### Verified
- ✅ tsc --noEmit clean
- ✅ npm test passes (N tests added)
- ✅ Page renders matching screenshots
- ✅ All 5 agents in dropdown
- ✅ Markdown rendering works (tested with contacts table from screenshot 4)
- ✅ Send message flow works end-to-end (user bubble → loading → assistant bubble)
- ✅ Agent switch triggers history fetch and replaces messages
- ✅ Profile save fires on new session_id
- ✅ Error states handled (operator-verified)
- ✅ Mobile responsive at 375/768/1024

### Concerns
- [auto-scroll quirks if any]
- [Streamlit-vs-React UX differences if any]

### Next Phase
- Phase 6: Mission Control
- Proposed actions:
  - Build mission-control page with 4 agent instruction blocks
  - Wire to instructionsService (mocked)
  - Save flow with toast and error Alert
  - Gatekeeper redirect

### Awaiting Approval
```

### Step 12 — Update RECOVERY.md and Stop

---

## Verification Gate

- [ ] All sidebar elements render per spec
- [ ] All main column elements render per spec
- [ ] Markdown table renders (contacts table from screenshot 4)
- [ ] Send flow works end-to-end
- [ ] Agent switch works
- [ ] Loading state shows
- [ ] Error states handled
- [ ] Mobile responsive
- [ ] Tests pass
- [ ] tsc clean

---

## Anti-Patterns To Avoid

- ❌ `dangerouslySetInnerHTML` for message content — use react-markdown
- ❌ Skipping `remark-gfm` — tables won't render
- ❌ Putting Supabase calls in components — only authService touches Supabase
- ❌ Importing mock data directly in components — only services touch mocks
- ❌ Building empty/loading/error states as afterthought — build them as you go
- ❌ Forgetting auto-scroll on new message
- ❌ Forgetting to disable input during in-flight send
