# UI_SPEC.md — Cyberize Agentic Automation

> **Screen-by-screen specification for the Next.js conversion.**
> Derived from extraction `06-PROMPTS-AND-PERSONA.md` (SCREEN INVENTORY) and the original Streamlit screenshots.
> Stick to faithful conversion — no UI improvements beyond Shadcn/Tailwind defaults.

> **Version:** 1.0 | **Date:** 2026-05-23

---

## 1. Screens Overview

The app has **three pages** and **one cross-cutting auth gate state**:

| Screen | Route | Auth required | Purpose |
|---|---|---|---|
| Login | `/` (unauthenticated) | No | Supabase auth |
| Chat | `/` (authenticated) or `/chat` | Yes | Talk to agents |
| Mission Control | `/mission-control` | Yes (gated) | Edit agent instructions |
| Gatekeeper Block | (any protected route, unauthenticated) | N/A — renders inline | Redirect to login |

**Routing decision:** The original Streamlit uses path-based multi-page nav. The Next.js App Router version SHOULD use:
- `/login` for the login page (NEW — Streamlit had no explicit login URL)
- `/chat` (or `/`) for the authenticated chat
- `/mission-control` for the instructions editor

Use middleware or layout-level checks to redirect unauthenticated users from `/chat` and `/mission-control` to `/login`.

---

## 2. Global Layout

### 2.1 App Shell (authenticated pages)

```
┌─────────────────────────────────────────────────────────────┐
│  [Rainbow gradient strip — top border]                      │  ← visual signature from screenshots
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│   SIDEBAR    │              MAIN CONTENT                    │
│              │                                              │
│   [Nav]      │              [Page-specific]                 │
│   - chat     │                                              │
│   - Mission  │                                              │
│              │                                              │
│   [Auth]     │                                              │
│   email      │                                              │
│   [Logout]   │                                              │
│              │                                              │
│   [Config]   │                                              │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

**Sidebar width:** ~256-280px (Shadcn Sidebar default).
**Top gradient strip:** Visible in screenshots as a thin rainbow line across the top. Use a CSS gradient: `bg-gradient-to-r from-blue-500 via-pink-500 via-orange-400 to-yellow-300` (approximate from screenshots).
**Collapsible sidebar:** Screenshot 3 shows a `«` collapse button — implement using Shadcn Sidebar's built-in collapse.

### 2.2 Theme

- **Light theme only** (Streamlit default, screenshots are light)
- Default Shadcn theme colors
- No dark mode in Phase 1
- Font: Shadcn default (Inter or system stack)

### 2.3 Responsive Behavior

| Breakpoint | Sidebar | Main |
|---|---|---|
| Mobile (<768px) | Hidden by default, slide-over via hamburger | Full width |
| Tablet (768-1024px) | Collapsed icons only by default | Remainder |
| Desktop (>1024px) | Expanded full sidebar | Remainder |

---

## 3. SCREEN A — Login

### 3.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Rainbow gradient strip]                                   │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  [Nav only,  │                                              │
│   no auth]   │      ⚡  Mission Control Login               │
│              │                                              │
│  chat        │     ┌──────────────────────────────────┐    │
│  Mission     │     │  Email                            │    │
│  Control     │     │  [moose1@email.com_____________] │    │
│              │     │                                   │    │
│              │     │  Password                         │    │
│              │     │  [••••••••_______________] [eye] │    │
│              │     │  Press Enter to submit form       │    │
│              │     │                                   │    │
│              │     │  [Authenticate]                   │    │
│              │     └──────────────────────────────────┘    │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

(Reference: screenshot 1)

### 3.2 Elements

| # | Element | Shadcn primitive | Label / placeholder | Behavior |
|---|---|---|---|---|
| 1 | Page title | `<h1>` with Tailwind `text-3xl font-bold` | `⚡ Mission Control Login` | Static |
| 2 | Form card | `Card` with `CardContent` | — | Wraps form fields |
| 3 | Email input | `Input type="email"` + `Label` | label `Email` | Required, no client-side format check |
| 4 | Password input | `Input type="password"` + `Label` | label `Password` | Required, masked, eye toggle (Shadcn pattern) |
| 5 | Submit hint | `<p class="text-sm text-muted-foreground">` | `Press Enter to submit form` | Shows when Password field is focused |
| 6 | Submit button | `Button` | `Authenticate` | Triggers Supabase auth |
| 7 | Error callout | `Alert variant="destructive"` | Dynamic | Shown below form on auth failure |

### 3.3 States

| State | Trigger | Visual |
|---|---|---|
| **Initial** | First load, no session | Form rendered, no error, button enabled |
| **Submitting** | After click/Enter, awaiting response | Button shows loading spinner; inputs disabled |
| **Error** | Supabase throws | Red `Alert` below form: `"Authentication failed: <message>"` |
| **Success** | Supabase returns session | Redirect to `/chat`; no transition animation |

### 3.4 Interactions

- **Submit form** (Enter or Authenticate button click) → `authService.signIn({email, password})` → on success, redirect; on failure, show alert
- **Toggle password visibility** → eye icon toggles `type="password"` ↔ `type="text"`
- **Focus password field** → show "Press Enter to submit form" hint (screenshot 1 shows this)

### 3.5 Validation

- Email field: HTML `type="email"` only (no extra JS validation)
- Password field: no min length, no strength check (matches Streamlit)
- Both required: HTML `required` attribute is fine

### 3.6 Data Sources

- Calls `authService.signIn` (Supabase via starter kit — real, not mock)
- No other data on this screen

---

## 4. SCREEN B — Chat

### 4.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Rainbow gradient strip]                                   │
├──────────────┬──────────────────────────────────────────────┤
│  chat (sel)  │                                              │
│  Mission     │      ⚡  Cyberize Agentic Automation          │
│  Control     │                                              │
│              │      [User bubble]                           │
│  Authenti-   │      [Assistant bubble — markdown content]   │
│  cated as:   │      ...                                     │
│  moose1@     │      (scrollable history)                    │
│  email.com   │                                              │
│              │                                              │
│  [Logout]    │                                              │
│              │                                              │
│  Config      │                                              │
│              │                                              │
│  Choose      │                                              │
│  agent:      │                                              │
│  [jarvis▼]   │                                              │
│              │      ┌────────────────────────────────────┐ │
│  Chatting    │      │ Ask jarvis_agent a question... [→] │ │
│  with:       │      └────────────────────────────────────┘ │
│  jarvis_agt  │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

(Reference: screenshots 4, 5, 6)

### 4.2 Sidebar Elements

| # | Element | Shadcn primitive | Source data | Behavior |
|---|---|---|---|---|
| 1 | Page nav links | `SidebarMenuItem` | Static | Top of sidebar; "chat" and "Mission Control" |
| 2 | "Authenticated as:" label | `<p class="text-sm">` | Static | Caption |
| 3 | Email link | `<a>` styled blue | `user.email` | Display only (no action on click required for Phase 1) |
| 4 | Logout button | `Button variant="outline"` | — | Calls `authService.signOut()` |
| 5 | Section title | `<h3>` | Static | `Configuration` |
| 6 | Agent dropdown label | `Label` | Static | `Choose an agent:` |
| 7 | Agent dropdown | `Select` + `SelectTrigger` + `SelectContent` | `AGENT_OPTIONS` (5 agents) | Triggers agent switch |
| 8 | Selection echo card | `Card` or styled `<div>` | `selectedAgent` | Text: `Chatting with:` + bold agent name |

**Selection echo styling:** Screenshots show a light-blue tinted card with `Chatting with:` (regular) above the agent name (bold). Use Shadcn `Card` with subtle bg color (`bg-blue-50 border-blue-200`).

### 4.3 Main Column Elements

| # | Element | Shadcn primitive | Behavior |
|---|---|---|---|
| 1 | Page title | `<h1>` with `text-3xl font-bold` | `⚡ Cyberize Agentic Automation` (static) |
| 2 | Message scroll area | `ScrollArea` | Auto-scrolls to bottom on new message |
| 3 | User message bubble | Custom component using `Avatar` + content card | User icon + message text |
| 4 | Assistant message bubble | Custom component using `Avatar` + content card | Robot icon + markdown content |
| 5 | Chat input | Custom `<Input>` or `Textarea` + send button | Anchored to bottom, sticky positioning |

### 4.4 Message Bubble Spec

**User bubble (left-aligned, red-pink avatar):**
```
[👤]  [Bubble background light-grey]
       message content
```
- Avatar: simple emoji or icon with red/pink background (matches screenshots — looks like a face icon on `bg-red-400` or similar)
- Content: plain text, no markdown rendering needed (user input)

**Assistant bubble (left-aligned, orange/yellow avatar):**
```
[🤖]  [Bubble background light-grey or transparent]
       markdown content (tables, lists, bold, code)
```
- Avatar: robot icon with orange/yellow background (matches screenshots — `bg-orange-400` approximately)
- Content: **renders markdown via `react-markdown` + `remark-gfm`**
- MUST support:
  - Headings (h1-h6)
  - Bold, italic
  - Code blocks with syntax highlighting (use `react-syntax-highlighter` or `shiki`)
  - Inline code
  - Lists (ul, ol)
  - **Tables (GFM)** — critical, see screenshot 4
  - Links
  - Blockquotes

**Tool-use disclosure pattern (in assistant content):**
From screenshot 4: `Tool I'm using: contacts_get_contacts   Reason: To retrieve...`
- This is just markdown inline code + plain text — no special UI component needed
- The agent emits it as part of the response string

### 4.5 Chat Input

- Sticky to bottom of main column
- Placeholder: `Ask {selectedAgent} a question...`
- Pressing Enter submits (Shift+Enter for newline if using Textarea)
- Send button (paper plane icon, right-aligned inside input or beside it)
- After submit:
  1. Input clears
  2. User bubble appears immediately
  3. Loading state shows ("Agent is thinking..." — see 4.6)
  4. Assistant bubble appears when response arrives

### 4.6 Loading State (Agent Thinking)

Replicates Streamlit's `st.spinner("Agent is thinking...")`:
- Appears in the message stream AFTER the user bubble, BEFORE the assistant bubble
- Use Shadcn `Skeleton` or a spinning icon (`Loader2` from lucide) with text
- Text: `Agent is thinking...`
- Disappears when response arrives

### 4.7 States (Chat Screen)

| State | Trigger | UI |
|---|---|---|
| **Empty (new user)** | First login, no session_id for first agent in dropdown | Main column: title only, no messages, chat input visible |
| **History loaded** | Agent-switch with bookmarked session_id, fetch succeeds | Bubbles render in chronological order |
| **History fetch error** | `getHistory` throws | Red `Alert`: `Failed to fetch history via wrapper: <error>`. Empty conversation. |
| **Sending (in-flight)** | User submits | User bubble + loading indicator visible; chat input disabled |
| **Send success** | `sendMessage` returns | Loading clears, assistant bubble appears |
| **Send error** | `sendMessage` throws | Red `Alert`: `Failed to connect to Agent Wrapper: <error>`. Assistant bubble shows error sentinel text. |
| **Profile save error** | `saveProfile` throws after new session_id | Red `Alert`: `Error saving profile: <error>` (chat continues, just sync error) |

### 4.8 Interactions

| # | Trigger | Effect |
|---|---|---|
| 1 | Click Logout | `authService.signOut()` → redirect to `/login` |
| 2 | Select different agent in dropdown | If different from current: update `lastSelectedAgent`, fetch session_id from profile, call `getHistory`, replace messages |
| 3 | Submit chat input | Append user message, show loading, call `sendMessage`, on response append assistant message, save profile if new session_id |

### 4.9 State Management (Zustand)

```typescript
interface ChatStore {
  selectedAgent: AgentName;
  lastSelectedAgent: AgentName | null;
  messages: Message[];
  agentSessions: AgentSessionMap;
  isLoading: boolean;
  setSelectedAgent: (name: AgentName) => void;
  appendMessage: (msg: Message) => void;
  setMessages: (msgs: Message[]) => void;
  setSession: (agent: AgentName, sessionId: string) => void;
  hydrate: (sessions: AgentSessionMap) => void;
}
```

This mirrors the Streamlit `st.session_state` keys: `messages`, `agent_sessions`, `last_selected_agent`, `session`.

### 4.10 Data Sources

| Datum | Service call | Triggered by |
|---|---|---|
| Initial `agent_sessions` | `profileService.fetchProfile(userId)` | On mount after auth resolves |
| Message history | `chatService.getHistory({...})` | On agent switch with bookmarked session_id |
| New message | `chatService.sendMessage({...})` | On chat input submit |
| Persist session_id | `profileService.saveProfile(userId, sessions)` | After new session_id received |

---

## 5. SCREEN C — Mission Control

### 5.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Rainbow gradient strip]                                   │
├──────────────┬──────────────────────────────────────────────┤
│  «           │                                              │
│              │      🎛️  Mission Control                     │
│  chat        │      Update agent instructions in real-time. │
│  Mission     │      ──────────────────────────────          │
│  Control     │                                              │
│  (selected)  │      Instructions for: greeting_agent        │
│              │      Modify instructions:                    │
│              │      ┌─────────────────────────────────┐    │
│              │      │ Your name is Rico! You are       │    │
│              │      │ friendly and funny assistant...  │    │
│              │      │ (250px tall textarea)            │    │
│              │      │                                  │    │
│              │      └─────────────────────────────────┘    │
│              │      [Save for greeting_agent]               │
│              │      ──────────────────────────────          │
│              │      Instructions for: calc_agent            │
│              │      ...                                     │
│              │      ... (repeat for jarvis_agent,           │
│              │           product_agent)                     │
└──────────────┴──────────────────────────────────────────────┘
```

(Reference: screenshots 2, 3)

**Note:** Sidebar has no auth display/logout on this page in the original — only the nav links and a collapse `«` button. We mirror that.

### 5.2 Page Header

| Element | Shadcn primitive | Content |
|---|---|---|
| Page title | `<h1>` `text-3xl font-bold` | `🎛️ Mission Control` |
| Subtitle | `<p class="text-muted-foreground">` | `Update agent instructions in real-time.` |
| Separator | `Separator` | Horizontal line below subtitle |

### 5.3 Per-Agent Block (Repeats 4 Times)

**Order (HARDCODED — see DATA_CONTRACT Section 4):**
1. `greeting_agent`
2. `calc_agent`
3. `jarvis_agent`
4. `product_agent`

(Note: `ghl_mcp_agent` is NOT in this list — preserved from original)

**Block structure:**

| # | Element | Shadcn primitive | Content |
|---|---|---|---|
| 1 | Section header | `<h2>` with `text-xl` | `Instructions for:` + `<code>{agent_name}</code>` (green-tinted code style — see screenshot 2) |
| 2 | Field label | `<label class="text-sm">` | `Modify instructions:` |
| 3 | Textarea | `Textarea` | 250px tall, value from `fetchInstructions(agent)`, key for state isolation |
| 4 | Save button | `Button variant="outline"` | `Save for {agent_name}` |
| 5 | Separator | `Separator` | Below button, before next block |

**Code-style agent name:** The original uses Streamlit's inline code formatting (backticks). Replicate with `<code class="px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-mono text-sm">{agent}</code>` (approximate from screenshot 2).

### 5.4 Initial Load Behavior

- On mount, call `fetchInstructions(agent)` 4 times (once per agent) — sequential is fine for Phase 1
- Show skeleton/loading state for each textarea until its fetch resolves
- If a fetch fails, the textarea shows the literal error string `Error: Could not load instructions for {agent_name}.` (matches Streamlit faithfully — Phase 2 problem)

### 5.5 Save Interaction

| Trigger | Effect |
|---|---|
| Click `Save for {agent}` | 1. Call `updateInstructions(agent, currentTextareaValue)`. 2. On success → `toast.success(\`Success! Instructions for \\\`${agent}\\\` updated.\`)`. 3. On failure → red `Alert` inline below the button: `Failed to update instructions for {agent}. Error: <e>` |

**Toast positioning:** Top-right (Shadcn Sonner default; screenshot 2 shows top-right placement). Auto-dismiss after ~3-4 seconds.

### 5.6 States

| State | Trigger | UI |
|---|---|---|
| **Initial loading** | Page mount | Skeleton in each textarea |
| **Loaded** | All fetches resolve | Textareas show current instructions |
| **One fetch failed** | Single GCS read error | That textarea shows error string as content; others normal |
| **Editing (unsaved)** | User typing | Textarea value diverges from fetched value (no visual indicator of dirty state in original — keep that way) |
| **Saving** | After save click | Button shows loading spinner; disabled |
| **Save success** | Save resolves | Toast appears top-right; button re-enables |
| **Save failure** | Save throws | Red alert below button; button re-enables; textarea retains unsaved edits |

### 5.7 Unauthenticated Access (Gatekeeper)

If user navigates to `/mission-control` without auth:

| Element | Shadcn primitive | Content |
|---|---|---|
| Warning callout | `Alert variant="warning"` (yellow/orange) | `⚠️ You must be logged in to access this page.` |
| Info callout | `Alert` (blue) | `Please log in through the main 'chat' page to continue.` |

**Note:** Original Streamlit does NOT auto-redirect to login. For the Next.js port, decide:
- **Option A (faithful):** Show the two alerts, no redirect (matches original)
- **Option B (better UX):** Use Next.js middleware to redirect to `/login`

**Recommendation:** Go with **Option B** (redirect via middleware). Document this as a deliberate divergence from the original — it's a clear UX improvement that doesn't break the spirit of the conversion.

### 5.8 Data Sources

| Datum | Service call | Triggered by |
|---|---|---|
| Per-agent instructions | `instructionsService.fetchInstructions(agent)` | On page mount, once per agent |
| Save instructions | `instructionsService.updateInstructions(agent, content)` | Save button click |

---

## 6. Cross-Cutting Behaviors

### 6.1 Auth Gate

- All routes except `/login` require authentication
- Implementation: Next.js middleware OR layout-level check
- Unauthenticated → redirect to `/login` (preferred) or render gatekeeper alerts (faithful)
- Auth state managed by Supabase client + Zustand store

### 6.2 Sidebar Navigation

- "chat" and "Mission Control" links visible on all authenticated pages
- Selected page is highlighted (Shadcn Sidebar handles this)
- Mobile: hidden behind hamburger; slide-over on tap
- Desktop: always visible; can collapse via `«` toggle

### 6.3 Error Handling Conventions

| Severity | Component | Lifetime |
|---|---|---|
| Critical (e.g., auth fail) | `Alert variant="destructive"` | Persistent inline until next state change |
| Warning (e.g., gatekeeper) | `Alert variant="warning"` (or default with warning icon) | Persistent until navigation |
| Info (e.g., guidance) | `Alert` (default blue) | Persistent until navigation |
| Success (e.g., save) | `toast.success()` | Transient ~3-4 seconds |

### 6.4 Loading States

- Inline spinners for button-triggered actions (`Loader2` from lucide-react)
- Skeleton placeholders for initial data loads (`Skeleton` from Shadcn)
- Streamlit-style "Agent is thinking..." for chat sends

### 6.5 Empty States

| Screen | Empty when | Display |
|---|---|---|
| Chat | No messages in current session | Title visible, no message area content, chat input usable. No "Welcome" text (matches original). |
| Mission Control | (not applicable — always 4 agent blocks) | — |

### 6.6 Markdown Rendering Requirements

For assistant message bubbles ONLY (user messages are plain text):

- Library: `react-markdown` v9+ with `remark-gfm` plugin
- Renderers/components:
  - `code` (block) — use `react-syntax-highlighter` with `oneLight` or similar
  - `code` (inline) — Tailwind-styled inline code
  - `table` — Tailwind table styles (matches screenshot 4)
  - `a` — open in new tab with `rel="noopener noreferrer"`
- Sanitization: react-markdown sanitizes by default; no `dangerouslySetInnerHTML` ever

### 6.7 Auto-Scroll Behavior (Chat)

- New messages should auto-scroll to bottom
- If user scrolls up to read history, do NOT auto-scroll on new messages
- Show a "↓ Jump to bottom" button when scrolled up
- (This is the common chat UX gotcha — flag to engineer)

---

## 7. Component Inventory (For Engineer's File Tree)

Suggested components (Engineer can adjust naming):

```
/src/components/
├── layout/
│   ├── AppShell.tsx              ← rainbow strip + sidebar + main
│   ├── Sidebar.tsx               ← nav + auth + config sections
│   └── GradientStrip.tsx         ← the top rainbow line
├── auth/
│   ├── LoginForm.tsx
│   └── GatekeeperAlert.tsx       ← optional, if Option A from 5.7
├── chat/
│   ├── ChatPage.tsx              ← orchestrator
│   ├── MessageList.tsx           ← scroll area + bubbles
│   ├── MessageBubble.tsx         ← user or assistant variant
│   ├── ChatInput.tsx             ← bottom sticky input
│   ├── AgentSelector.tsx         ← sidebar dropdown
│   ├── ChattingWithCard.tsx      ← the blue "Chatting with:" card
│   └── ThinkingIndicator.tsx     ← "Agent is thinking..."
├── mission-control/
│   ├── MissionControlPage.tsx    ← orchestrator
│   ├── AgentInstructionBlock.tsx ← one repeating block
│   └── SaveButton.tsx            ← with loading state
└── ui/                            ← Shadcn primitives (generated)
    ├── alert.tsx
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    ├── label.tsx
    ├── scroll-area.tsx
    ├── select.tsx
    ├── separator.tsx
    ├── sidebar.tsx
    ├── skeleton.tsx
    ├── sonner.tsx                 ← toast
    └── textarea.tsx
```

Routes:
```
/src/app/
├── layout.tsx                     ← root layout with AppShell
├── page.tsx                       ← / → redirect to /chat or /login
├── login/
│   └── page.tsx
├── chat/
│   └── page.tsx
└── mission-control/
    └── page.tsx
```

---

## 8. Out of UI_SPEC Scope

These were considered and explicitly excluded:

- No dark mode toggle
- No accessibility audit beyond Shadcn defaults
- No animations beyond Shadcn defaults
- No drag-and-drop, no keyboard shortcuts beyond Enter-to-submit
- No agent metadata display (icons, descriptions) — agents are name-only
- No conversation list / sidebar of past conversations
- No "clear conversation" button (matches Streamlit)
- No message timestamps (matches Streamlit)
- No message edit / delete / regenerate (matches Streamlit)
- No streaming response display (matches Streamlit — original is request-response)
- No notifications, mentions, presence
- No search across conversations

---

## 9. Reference Screenshots

The six screenshots Stark provided are the canonical visual reference:

| File | Screen | Notes |
|---|---|---|
| `image.png` | Login | Form, "Press Enter to submit form" hint visible |
| `image__1_.png` | Mission Control (calc_agent block, success toast) | Toast top-right `Success! Instructions for calc_agent updated.` |
| `image__2_.png` | Mission Control (greeting_agent block) | Shows initial loading complete state |
| `image__3_.png` | Chat (ghl_mcp_agent with contacts table) | Tool-use disclosure + markdown table critical example |
| `image__4_.png` | Chat (jarvis_agent dropdown open) | Shows all 5 agents in dropdown |
| `image__5_.png` | Chat (greeting_agent, casual reply) | Shows the agent contextualizing user location |

When in doubt about visual specifics, the screenshots win over this spec's text descriptions.

---

## 10. Verification Checklist

Before declaring UI_SPEC.md ready for Engineer handoff:

- [x] Every screen from extraction `06-PROMPTS-AND-PERSONA.md` is covered
- [x] Every element has a Shadcn primitive identified
- [x] Every interaction is mapped to a service method
- [x] All states (loading, empty, error, success) are specified
- [x] Markdown rendering requirements documented (tables matter)
- [x] Auth gating strategy chosen
- [x] Mobile responsiveness rules stated
- [x] Component file tree suggested
- [x] Out-of-scope list explicit

---

## 11. Changelog

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-05-23 | Initial spec from Brain Drain extraction + Stark's 6 screenshots |
