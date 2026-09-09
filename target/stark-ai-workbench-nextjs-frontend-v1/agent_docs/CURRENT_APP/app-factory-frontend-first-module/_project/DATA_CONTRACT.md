# DATA_CONTRACT.md — Cyberize Agentic Automation

> **Source of truth for every data shape that flows through the app.**
> Derived from `04-TOOL-SYSTEM.md` (API SURFACE) of the Brain Drain extraction.
> Mocks and real implementations BOTH satisfy these contracts.
> Field-level changes here MUST update mocks AND types before UI changes.

> **Version:** 1.0 | **Date:** 2026-05-23

---

## 1. Type-by-Type Reference

### 1.1 `Agent`

Static identity of an agent. Frontend-only model — there's no backend "agent" entity; agents are just names referenced by the wrapper and GCS.

```typescript
export interface Agent {
  name: AgentName;  // unique identifier, also the dropdown label
}

export type AgentName =
  | 'greeting_agent'
  | 'jarvis_agent'
  | 'calc_agent'
  | 'product_agent'
  | 'ghl_mcp_agent';
```

**Constraints:**
- `AgentName` is a finite string literal union — five values, exact spellings
- The original Streamlit app uses these strings as both ID and display label (no separate display names)
- Mission Control's hardcoded list is a **subset of 4** — see Section 4

**Source:** `04-TOOL-SYSTEM.md:70`, `06-PROMPTS-AND-PERSONA.md:124-128`

---

### 1.2 `User`

Authenticated Supabase user. Frontend reads only two fields.

```typescript
export interface User {
  id: string;     // Supabase UUID (auth.users.id)
  email: string;  // Displayed in sidebar
}
```

**Constraints:**
- `id` is a UUID string (Supabase format)
- Frontend does NOT read or use `access_token`, `refresh_token`, expiry, or other session fields
- Source-of-truth for additional fields is the Supabase SDK's session object; we proxy two fields

**Source:** `04-TOOL-SYSTEM.md:202-208`

---

### 1.3 `Message`

A single chat message in a conversation.

```typescript
export interface Message {
  role: MessageRole;
  content: string;  // Markdown-formatted text
}

export type MessageRole = 'user' | 'assistant';
```

**Constraints:**
- Only `'user'` and `'assistant'` appear in this codebase. No `'system'`, no `'tool'`.
- `content` is rendered as markdown (including GFM tables). Sender-trusted, but Streamlit/React both escape raw HTML by default.
- Messages have NO `id`, NO `timestamp`, NO `agent_name` in the wire format. Per APPROVED briefing, the Next.js port mirrors this exactly.

**Notes for Phase 2:** The wrapper MAY return additional per-message fields (timestamp, tool_calls, etc.) — the Streamlit code doesn't read them. The Next.js port is free to extend the type later if a real backend response includes more.

**Source:** `04-TOOL-SYSTEM.md:157-160`, `06-PROMPTS-AND-PERSONA.md:225-226`

---

### 1.4 `RunAgentRequest`

Outgoing payload when the user sends a chat message.

```typescript
export interface RunAgentRequest {
  agent_name: AgentName;
  message: string;        // raw user input
  user_id: string;        // Supabase UUID
  session_id: string | null;  // null on first-ever message to this agent
}
```

**Constraints:**
- `session_id` is `null` (serialized as JSON `null`) on the first message to a given agent for a given user
- After the first round-trip, the wrapper-issued session ID is bookmarked and reused
- Field names are snake_case (matches wrapper's FastAPI convention)

**Source:** `04-TOOL-SYSTEM.md:60-75`

---

### 1.5 `RunAgentResponse`

Incoming response from the wrapper. **ONLY two fields are read by the original.**

```typescript
export interface RunAgentResponse {
  response: string;      // assistant's reply text (markdown)
  session_id: string;    // wrapper-issued session id (may equal or differ from request's)
}
```

**Constraints:**
- The wrapper may return more fields — they're ignored by the frontend
- On client-side HTTP error, the service returns a sentinel: `{ response: "Error: Could not reach Agent Wrapper. Details: <e>", session_id: undefined }` — note `session_id` is missing, NOT null
- The `response` field defaults to `"Error: No response content."` if missing from response body

**Source:** `04-TOOL-SYSTEM.md:79-93, 100-103`

---

### 1.6 `GetHistoryRequest`

Outgoing payload when fetching conversation history.

```typescript
export interface GetHistoryRequest {
  agent_name: AgentName;
  user_id: string;
  session_id: string;  // required — client-side guards against null
}
```

**Constraints:**
- Unlike `RunAgentRequest`, `session_id` is REQUIRED (non-nullable)
- Client-side guard: if `session_id` is falsy, no HTTP call is made — empty array returned
- Method is POST (not GET, despite being read-only)
- Timeout: 30 seconds

**Source:** `04-TOOL-SYSTEM.md:119-138`

---

### 1.7 `GetHistoryResponse`

Incoming response from the wrapper for history fetch.

```typescript
export interface GetHistoryResponse {
  history: Message[];  // list of {role, content} pairs
}
```

**Constraints:**
- Defaults to `[]` if `history` field is missing from response
- On error, service returns `[]` — UI shows empty conversation
- Each item satisfies the `Message` interface exactly (no extra fields read)

**Source:** `04-TOOL-SYSTEM.md:142-160`

---

### 1.8 `ProfileRow` (Supabase)

The user's row in the `adk_n8n_hybrid_profiles` table.

```typescript
export interface ProfileRow {
  id: string;                          // UUID, FK to auth.users.id
  agent_sessions: AgentSessionMap;     // jsonb in Postgres
}

export type AgentSessionMap = Record<AgentName | string, string>;
//                                                          ^ session_id (UUID-like string from wrapper)
```

**Constraints:**
- `agent_sessions` is a flat object: `{ "greeting_agent": "session-xyz", ... }`
- Only contains entries for agents the user has actually chatted with
- Full-dict overwrite on upsert (not patch/merge)
- New users have `{}` initially
- Phase 1 mocks this in-memory or via localStorage (your call); Phase 2 wires real Supabase

**Source:** `04-TOOL-SYSTEM.md:275-289`

---

### 1.9 `LoginRequest`

Outgoing payload for Supabase auth.

```typescript
export interface LoginRequest {
  email: string;
  password: string;
}
```

**Constraints:**
- No client-side validation (no email format check, no password strength check) — matches Streamlit original
- Validation is delegated entirely to Supabase

**Source:** `04-TOOL-SYSTEM.md:188-197`

---

### 1.10 `LoginResponse`

Subset of Supabase auth response that the frontend reads.

```typescript
export interface LoginResponse {
  session: {
    user: {
      id: string;
      email: string;
    };
  };
}
```

**Constraints:**
- Supabase returns more (`access_token`, `refresh_token`, expiry) — frontend ignores them
- The `session` object is stored opaquely in app state; only `.user.id` and `.user.email` are accessed

**Source:** `04-TOOL-SYSTEM.md:444-455`

---

### 1.11 `InstructionBlob` (GCS / mocked storage)

Agent instruction text — plain UTF-8 string.

```typescript
export type InstructionBlob = string;
```

**Constraints:**
- Plain text, no schema, no JSON
- One blob per agent: identified by `agent_name`
- In Phase 1: stored in mock (in-memory map or localStorage)
- In Phase 2: GCS at path `{BUCKET}/{BASE_FOLDER}/{agent_name}/{agent_name}_instructions.txt`
- Content-Type when written: `text/plain`
- Encoding: UTF-8
- Overwrites in place — no versioning client-side

**Phase 1 hazard:** If a read fails, the original returns literal string `"Error: Could not load instructions for {agent_name}."` — the Next.js mock should mirror this behavior to preserve fidelity (but Phase 2 likely improves this — see Section 5).

**Source:** `04-TOOL-SYSTEM.md:323-345, 459-466`

---

### 1.12 `AppConfig`

Runtime configuration loaded at boot.

```typescript
export interface AppConfig {
  appEnv: 'local' | 'cloud';
  wrapperUrl: string;       // resolved from config.json by appEnv
  agentOptions: AgentName[];
}
```

**Constraints:**
- `appEnv` defaults to `'local'` if not set
- `wrapperUrl` for local: `http://localhost:8080`; for cloud: `https://adk-wrapper-prod-v2-952978338090.us-east1.run.app`
- `agentOptions` is the array of 5 agents from `config.json`

**Phase 1 note:** Since the wrapper is mocked, `wrapperUrl` is informational. Phase 2 wires it.

**Source:** `04-TOOL-SYSTEM.md:39-43`, `06-PROMPTS-AND-PERSONA.md:124-128`

---

## 2. Service Method Contracts

These are the methods the UI calls. The service layer is the only swap point.

### 2.1 `authService`

```typescript
interface AuthService {
  signIn(input: LoginRequest): Promise<User>;
  signOut(): Promise<void>;
  getCurrentUser(): User | null;
}
```

**Phase 1 behavior:**
- `signIn`: uses real Supabase via starter kit (NOT mocked — auth is the one real integration in Phase 1)
- `signOut`: clears client session only (matches Streamlit's behavior — no server-side invalidation)
- `getCurrentUser`: reads from Supabase session

**BACKEND_SWAP_NOTES:** None needed. Already real in Phase 1.

---

### 2.2 `chatService`

```typescript
interface ChatService {
  sendMessage(input: RunAgentRequest): Promise<RunAgentResponse>;
  getHistory(input: GetHistoryRequest): Promise<Message[]>;
}
```

**Phase 1 behavior:**
- `sendMessage`: returns a mocked `RunAgentResponse` after 800-2000ms simulated delay; the mock generates a plausible reply based on the agent name (see Section 3)
- `getHistory`: returns a mocked `Message[]` for the given `session_id`; empty array if session is unknown

**BACKEND_SWAP_NOTES:**
- `sendMessage` → `POST {WRAPPER_URL}/run_agent` (90s timeout)
- `getHistory` → `POST {WRAPPER_URL}/get_history` (30s timeout)
- Error handling: bare catch, return sentinel response with error string

---

### 2.3 `profileService`

```typescript
interface ProfileService {
  fetchProfile(userId: string): Promise<AgentSessionMap>;
  saveProfile(userId: string, sessions: AgentSessionMap): Promise<void>;
}
```

**Phase 1 behavior:**
- `fetchProfile`: returns mocked map (in-memory or localStorage); `{}` for new users
- `saveProfile`: persists to mock storage; in-session only OR localStorage for cross-reload persistence

**BACKEND_SWAP_NOTES:**
- `fetchProfile` → `supabase.from('adk_n8n_hybrid_profiles').select('agent_sessions').eq('id', userId)`
- `saveProfile` → `supabase.from('adk_n8n_hybrid_profiles').upsert({ id: userId, agent_sessions: sessions })`
- RLS policies on the table assumed to enforce per-user isolation

---

### 2.4 `instructionsService`

```typescript
interface InstructionsService {
  fetchInstructions(agentName: AgentName): Promise<InstructionBlob>;
  updateInstructions(agentName: AgentName, content: InstructionBlob): Promise<void>;
}
```

**Phase 1 behavior:**
- `fetchInstructions`: returns mocked instruction text per agent (see Section 3)
- `updateInstructions`: writes to in-memory map or localStorage; throws on simulated failure (rare)

**BACKEND_SWAP_NOTES:**
- `fetchInstructions` → GCS `blob.download_as_text()` from `gs://{BUCKET}/{BASE_FOLDER}/{agentName}/{agentName}_instructions.txt`
- `updateInstructions` → GCS `blob.upload_from_string(content, content_type='text/plain')`
- **Open architectural question for Phase 2/3:** Direct GCS from Next.js (via API route + service account) OR new wrapper endpoint? Per extraction `10-RAW-FINDINGS-AND-QUESTIONS.md` F7, this is Stark's call.

---

## 3. Mock Data Requirements

### 3.1 Mock Agents (5 agents from config)

```typescript
const MOCK_AGENTS: AgentName[] = [
  'greeting_agent',
  'jarvis_agent',
  'calc_agent',
  'product_agent',
  'ghl_mcp_agent',
];
```

### 3.2 Mock Instructions (per agent)

The Streamlit screenshots show real instruction text examples. Mock these realistically:

- **`greeting_agent`**: friendly assistant with a resume-reader tool reference (matches screenshot)
- **`jarvis_agent`**: JARVIS persona with google_search tool, English language preference (matches screenshot)
- **`calc_agent`**: Rico the calculator with code execution + memory (matches screenshot)
- **`product_agent`**: product assistant for an e-commerce-style use case
- **`ghl_mcp_agent`**: agent using contacts/MCP tools (matches screenshot 4)

### 3.3 Mock Messages (per session)

- Empty array for new sessions
- For continuity testing, seed 2-4 messages per agent showing varied content:
  - Plain text exchanges
  - Markdown formatting (bold, italic, lists)
  - Code blocks
  - **Markdown tables** (the ghl_mcp_agent contacts table is the most important to demo — see UI_SPEC)
  - Tool-use disclosures (the "Tool I'm using: X | Reason: Y" pattern from screenshot 4)

### 3.4 Mock `RunAgentResponse` Generation

For sent messages, the mock should:
- Echo the user message in the agent's voice
- For `calc_agent`: simulate math responses
- For `jarvis_agent`: respond formally with "sir" / "Mr. Stark"
- For `ghl_mcp_agent`: occasionally return a markdown table response
- For `greeting_agent`: friendly conversational responses
- Generate a fresh `session_id` on first message (e.g., `mock-session-${Date.now()}`)
- Return same `session_id` on subsequent messages in the same session

### 3.5 Edge Cases to Cover

- Empty message (should it submit? — original allows it; mock can too)
- Very long message (test wrapping)
- Markdown injection in message (test escaping)
- Failed wrapper call (mock random or deterministic failure path)
- Failed history fetch (return error state)
- Unknown `session_id` in `getHistory` (return empty array)

---

## 4. Agent List Discrepancy (Known)

Two agent lists exist in the original:

| Source | List | Count |
|---|---|---|
| `config.json` → Chat dropdown | `greeting_agent, jarvis_agent, calc_agent, product_agent, ghl_mcp_agent` | 5 |
| `pages/1_Mission_Control.py` hardcoded | `greeting_agent, calc_agent, jarvis_agent, product_agent` | 4 (missing `ghl_mcp_agent`, different order) |

**Per APP_BRIEF.md Section 10:** This drift is **preserved as-is** in the Next.js port. The Chat dropdown shows 5 agents. Mission Control shows 4 agents in the order `greeting_agent, calc_agent, jarvis_agent, product_agent`.

**Implementation:** Hardcode both lists in code (different files, like the original) OR centralize in a config with two named exports. Either approach is fine — preserve behavior, not necessarily the file layout.

---

## 5. Phase 2 Decision Points (Documented Here For Future)

These are NOT to be solved in Phase 1. Captured here so Phase 2 has a checklist.

1. **Direct GCS write vs wrapper endpoint** for Mission Control saves. Per extraction F7.
2. **Stale session_id handling** — the commented-out purge logic (per extraction F10). Phase 2 decides whether to enable.
3. **Logout server-side invalidation** — should we call `supabase.auth.signOut()` to revoke JWT? Per extraction `08-` F3.
4. **Wrapper authentication** — Streamlit sends no auth header. Phase 2 may need an API key or service-to-service auth. Per extraction `07-`.
5. **`ghl_mcp_agent` in Mission Control** — fix the drift or preserve. Per extraction F1.
6. **Error state for failed instruction fetch** — currently displays error string in textarea. Phase 2 may want a proper error UI. Per extraction `08-` F2.

---

## 6. Field-by-Field Mapping (Streamlit → TypeScript)

For the engineer doing the actual port, the field name mapping is direct (no renaming):

| Streamlit / Wrapper | TypeScript |
|---|---|
| `agent_name` | `agent_name` (preserve snake_case for wire shapes) |
| `user_id` | `user_id` |
| `session_id` | `session_id` |
| `response` | `response` |
| `history` | `history` |
| `role` | `role` |
| `content` | `content` |
| `id` (Supabase) | `id` |
| `agent_sessions` | `agent_sessions` |
| `email` | `email` |
| `password` | `password` |

**Convention:** Wire shapes use snake_case. UI-internal types may use camelCase (e.g., `AgentSessionMap` is camelCase, but `RunAgentRequest.agent_name` is snake_case). This mirrors the FastAPI/Pydantic convention on the backend.

---

## 7. Verification Checklist

Before declaring DATA_CONTRACT.md complete for Phase 1:

- [x] Every wire shape from extraction `04-TOOL-SYSTEM.md` is represented
- [x] Every service method has a contract
- [x] Phase 1 vs Phase 2 behavior is documented per service
- [x] Mock data requirements specified
- [x] Edge cases enumerated
- [x] Known discrepancies documented (not fixed)
- [x] Phase 2 decision points captured

---

## 8. Changelog

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-05-23 | Initial contract from Brain Drain extraction. Phase 1 = mocks everywhere except auth. |
