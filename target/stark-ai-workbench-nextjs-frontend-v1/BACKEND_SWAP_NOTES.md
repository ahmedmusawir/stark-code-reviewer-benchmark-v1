# Backend Swap Notes

> **For the engineer doing the overall-lifecycle Phase 2 backend wiring.**
> This doc consolidates every service method's mock behavior and the target real-backend implementation. Authored at the end of Run 001 (frontend-first phase, 2026-05-29).
>
> Companion doc: `_project/DATA_CONTRACT.md` Sections 2 + 5.

---

## The Swap Point

UI components in this app **only** call methods on `src/services/`. They never touch Supabase, the wrapper, or GCS directly. To swap from mock to real:

1. Edit each service file's method bodies (signatures stay identical — they're locked by Phase 1's `src/types/index.ts`).
2. Delete `src/mocks/` in one commit.
3. UI components don't change.

If the UI ever needs to change to accommodate a backend reality, that's a contract violation — re-open the data contract first.

---

## `authService` (NOT WRAPPED — kit handles it)

Auth is fully wired by the Stark SaaS Starter kit baseline:

- `useAuthStore` (Zustand) — current user + role + isAuthenticated
- `src/utils/supabase/{client, server, admin, middleware}.ts` — three Supabase clients
- `/api/auth/{login, logout, signup, confirm, superadmin-add-user}` — kit's auth API routes
- `protectPage([roles])` — server-side route guard
- `getUserRole(userId)` — DB lookup from `user_roles` table
- `AppRole` enum — `superadmin | admin | member`
- DB trigger `handle_new_user()` — auto-populates `profiles` + `user_roles` on signup

UI components in cyberize consume these directly. **There is no `authService.ts`** in our service layer — see `STARTER_KIT_FEEDBACK.md` Lesson 2 for why.

**Phase 2 of overall lifecycle: nothing to do for auth.** It's already real.

---

## `chatService` — mock → FastAPI wrapper

**File:** `src/services/chatService.ts`

### `sendMessage(input: RunAgentRequest): Promise<RunAgentResponse>`

| | Today (mock) | Phase 2 (real) |
|---|---|---|
| Implementation | Calls `generateMockResponse(input.agent_name, input.message, input.session_id)` after 1000ms simulated delay | `POST {WRAPPER_URL}/run_agent` with JSON body |
| Timeout | 1000ms simulated | **90 seconds** (per DATA_CONTRACT §2.2) |
| Body shape | Same as request (snake_case fields) | Same — wire format already matches |
| Error handling | Mocks don't throw | Bare `try/catch`. On failure, return sentinel: `{ response: "Error: Could not reach Agent Wrapper. Details: <e>", session_id: undefined }` per DATA_CONTRACT §1.5. Default `response` to `"Error: No response content."` if missing from response body. |
| Wrapper auth | n/a | **OPEN QUESTION** — Streamlit original sent no auth header. See Open Question 4 below. |

### `getHistory(input: GetHistoryRequest): Promise<Message[]>`

| | Today (mock) | Phase 2 (real) |
|---|---|---|
| Implementation | Returns `mockMessagesBySession[input.session_id] ?? []` after 200ms delay | `POST {WRAPPER_URL}/get_history` with JSON body |
| Timeout | 200ms simulated | **30 seconds** |
| Method | n/a (mock) | POST (NOT GET, despite being read-only) per DATA_CONTRACT §1.6 |
| Client-side guard | n/a | If `session_id` is falsy, return `[]` without making the HTTP call. |
| Error handling | Mocks don't throw | On failure, return `[]`. UI renders empty conversation. |

---

## `profileService` — mock → Supabase

**File:** `src/services/profileService.ts`

Operates on the `adk_n8n_hybrid_profiles` table. RLS policies on that table are assumed to enforce per-user row isolation (`auth.uid() = id`).

### `fetchProfile(userId: string): Promise<AgentSessionMap>`

| | Today (mock) | Phase 2 (real) |
|---|---|---|
| Implementation | Returns `mockProfileStore[userId] ?? {}` after 200ms delay | `supabase.from('adk_n8n_hybrid_profiles').select('agent_sessions').eq('id', userId).single()` |
| New users | Returns `{}` | Returns `{}` if no row exists. Frontend hydrates an empty map. |
| Client choice | n/a | Use `createClient()` (server) for server components, `createClient()` (browser) inside client components. For our ChatPageContent (client), use the browser client. |
| Error handling | Mocks don't throw | On error, return `{}` — UI continues with empty session map. |

### `saveProfile(userId: string, sessions: AgentSessionMap): Promise<void>`

| | Today (mock) | Phase 2 (real) |
|---|---|---|
| Implementation | Mutates `mockProfileStore[userId] = sessions` (in-memory; reloads wipe) | `supabase.from('adk_n8n_hybrid_profiles').upsert({ id: userId, agent_sessions: sessions })` |
| Update semantics | Full-dict overwrite (NOT patch/merge) | Same — upsert replaces `agent_sessions` whole-cloth |
| Error handling | Mocks don't throw | UI shows a warning Alert ("Profile save warning: ...") and continues. Chat is not blocked by profile save failure. |

---

## `instructionsService` — mock → GCS (or wrapper endpoint — see Open Question 1)

**File:** `src/services/instructionsService.ts`

### `fetchInstructions(agentName: AgentName): Promise<InstructionBlob>`

| | Today (mock) | Phase 2 (real) |
|---|---|---|
| Implementation | Returns `mockInstructionsStore[agentName]` after 200ms delay | GCS `blob.download_as_text()` from `gs://{BUCKET}/{BASE_FOLDER}/{agentName}/{agentName}_instructions.txt` |
| Encoding | UTF-8 string | UTF-8 string (matches mock) |
| Error handling | Mocks don't throw | On failure, return the literal string `"Error: Could not load instructions for {agentName}."` (preserves Streamlit original per DATA_CONTRACT §1.11). Mission Control UI shows this in the textarea — Phase 2 may improve to a proper error state (see Open Question 6). |

### `updateInstructions(agentName: AgentName, content: InstructionBlob): Promise<void>`

| | Today (mock) | Phase 2 (real) |
|---|---|---|
| Implementation | Mutates `mockInstructionsStore[agentName] = content` (in-memory) | GCS `blob.upload_from_string(content, content_type='text/plain')` |
| Versioning | None | None (overwrites in place — no client-side versioning) |
| Error handling | Mocks don't throw | Throw on failure. Mission Control's `AgentInstructionBlock` catches and shows an inline destructive Alert + skips the success toast. |

---

## Open architectural questions (for Phase 2 architecture decisions)

These were flagged in DATA_CONTRACT §5 as decisions the operator must make before backend wiring. None are answered yet.

### 1. Direct GCS write vs new wrapper endpoint for Mission Control saves

Two options for `instructionsService.updateInstructions`:

- **(a)** Direct GCS from Next.js — requires service account credentials in env, an API route at `/api/instructions/update` that the browser client can call, and bucket permissions. Faster to ship but introduces a new server-side surface.
- **(b)** New wrapper endpoint — extend the FastAPI wrapper with `POST /update_instructions` that owns the GCS write. Keeps Next.js out of file-storage land. Slower to ship but cleaner separation.

Per extraction `_extraction/10-RAW-FINDINGS-AND-QUESTIONS.md` F7. Operator's call.

### 2. Stale `session_id` handling

The Streamlit original has a commented-out purge block that, if enabled, would clear stale session IDs from `agent_sessions` after some TTL. Per `_extraction/10-` F10. Phase 2 decides: enable purge, leave commented, or implement server-side.

### 3. Logout server-side invalidation

The kit's `useAuthStore.logout()` POSTs to `/api/auth/logout` which calls `supabase.auth.signOut()`. That invalidates the session server-side, which DIVERGES from the Streamlit original (which only cleared client state). Per DATA_CONTRACT §5.3. Phase 2 decides whether to keep the kit's default (recommended — more secure) or revert to client-only logout.

### 4. Wrapper authentication

The Streamlit original sends no auth header to the wrapper. The wrapper is currently open. For Phase 2:

- Add API key check in wrapper + send `Authorization: Bearer <key>` from `chatService`
- OR migrate to service-to-service auth (e.g., signed JWT from Supabase user)
- OR put the wrapper behind an authenticated Next.js API route

Per `_extraction/07-GUARDRAILS-AND-SANDBOXING.md`. Operator's call. **Recommend deciding this before any production deploy.**

### 5. `ghl_mcp_agent` in Mission Control

DATA_CONTRACT §4 and Mission Control hardcode 4 agents (greeting, calc, jarvis, product) — omitting `ghl_mcp_agent` to preserve the Streamlit drift. Phase 2 decides: keep the drift, or add `ghl_mcp_agent` to MC's editable list. Per `_extraction/10-` F1.

### 6. Error state for failed instruction fetch

Currently `instructionsService.fetchInstructions` returns the literal string `"Error: Could not load instructions for {agentName}."` on failure (preserves Streamlit original). The textarea then displays this as content. Phase 2 may want a proper error UI: empty textarea + a banner above explaining the load failure + a retry button. Per `_extraction/08-ERROR-HANDLING.md` F2.

---

## What does NOT need swapping

- Auth: real already (kit handles it)
- Types in `src/types/index.ts`: locked at Phase 1; satisfied by both mocks and real
- UI components in `src/app/(cyberize)/`, `src/components/`, etc.: should not change during backend swap. If they do, it's a contract violation — re-open DATA_CONTRACT.md first.
- Routing, middleware, RBAC, RLS: kit baseline; untouched by this run.

---

## Estimated swap effort

- `chatService`: 1-2 hours (two HTTP calls, error handling, wrapper auth depends on Q4)
- `profileService`: 30-60 min (two Supabase calls, RLS verification)
- `instructionsService`: 2-4 hours (depends heavily on Q1 — direct GCS adds an API route + service account setup; wrapper endpoint requires Python work)
- Open questions resolution: ~1 hour each, mostly architectural conversations

Total: roughly **1-2 days of focused work** for a single engineer who knows the FastAPI wrapper and GCS basics.

---

## When the swap is done

1. Delete `src/mocks/` entirely (one commit)
2. Run all 121+ existing tests — should still pass (they test the service-method shapes, which don't change)
3. `npm run build` should still succeed
4. Manual smoke test: log in, chat with each agent, switch agents (history persists per agent), save instructions in Mission Control
5. Tag commit `phase-2-complete`
6. Begin Phase 3 of overall lifecycle (optional: replace wrapper with Next.js API routes) per `_project/CLAUDE.md` Phase Transitions table
