# BIM-004 — Preflight Plan (PENDING_APPROVAL)

_2026-07-19 19:05 · Engineer: Claudy · Module: BIM-004 (Projects UX — Multi-Session Per Agent)_
_Branch `bim-004` created by Coordinator; BIM-003 committed (`4585374` "bim-003 done not
tested"). NOTE: BIM-003 manual gates remain outstanding — its four-line test appears to
have been exercised (manifest now carries a 6th agent, `moose_mcp_agent`); P-G8 will
inherit whatever QA finds there. Manifest change requires no BIM-004 action._

## The four verifications (file:line)

**V1 — DB convention:** NO migrations dir. Convention = `supabase/setup.sql`, one file of
numbered STEP sections run top-to-bottom in the Supabase SQL Editor, with per-table
`ENABLE ROW LEVEL SECURITY` + named policies `TO authenticated USING (auth.uid() = …)`
(`setup.sql:32-41,57-73`). **Proposal:** A4's DDL lands as a NEW standalone file
`supabase/chat_sessions_setup.sql` in the same idiom (setup.sql is a run-once fresh-DB
script; appending would break existing DBs' re-run story). Flagged, not silent.

**V2 — Supabase client + user id:** browser client = `createBrowserClient` via
`src/utils/supabase/client.ts:3-8`; user id idiom = `supabase.auth.getUser()`
(`utils/supabase/fetchUserData.ts:5`, `actions.ts:10`). The service will use
`createClient()` + `auth.getUser()` for `user_id` on insert; RLS enforces row scoping.

**V3 — Store shapes (post FIX-002/BIM-003):** `chatStore.ts` — `selectedAgent` (string,
manifest default), `agentSessions: Record<agent, adkSessionId>` (THE FIX-001 pointer
map, persisted), `messagesByAgent: Record<agent, Message[]>` (in-memory, undefined =
not loaded), `isLoading`, `isHistoryLoading`, `error`; partialize =
`{agentSessions, selectedAgent}`. `ChatPageContent` mount effect currently merges
`profileService.fetchProfile` with the persisted map (FIX-001 amended precedence).

**V4 — UI placement:** `CyberizeSidebar.tsx:67-69` renders `<AgentSwitcher/>` in the
scrollable middle. **Proposal:** new `SessionPanel` component rendered directly below
AgentSwitcher in that same scroll region — a "Conversations" section for the SELECTED
agent (New Chat on top, list newest-first). Matches the existing sidebar idiom; zero
new deps; AgentSwitcher itself untouched.

## D6 reshape proposal (minimal correct shape)

- `agentSessions` KEEPS its name and persisted role — it demotes to "last active ADK
  session per agent" (the doctrine's cache). No rename → FIX-001/002 persistence and
  partialize survive byte-identical (F4 fence extends).
- ADD in-memory only: `sessionListByAgent: Record<agent, SessionIndexEntry[]>`.
- `messagesByAgent[agent]` = messages of that agent's ACTIVE session only. Session
  switch/new-chat clears it → the existing history-fetch flow (extended to watch the
  active pointer) refetches from the server. No (agent,session) message cache — the
  transcripts live server-side; refetch-on-switch is correct and simple.
- New actions: `setSessionList(agent, list)`, `upsertSessionEntry(agent, entry)`,
  `activateSession(agent, adkSessionId)` (set pointer + clear messages),
  `startNewChat(agent)` (clear pointer + set messages loaded-empty `[]`).
- **profileService exits the chat path** (D1): ChatPageContent's fetchProfile/
  saveProfile calls are REPLACED by the index flow. The service file itself is not
  edited. (Side effect: the FIX-001 "merge precedence" BIM-ladder item resolves — the
  merge disappears with its cause. Retrospective will record it.)

## Migration SQL (exact text — `supabase/chat_sessions_setup.sql`)

```sql
-- BIM-004 (Amendment A4): chat_sessions — the session INDEX. Which sessions
-- exist, never what was said. Transcripts stay in ADK's store.
CREATE TABLE public.chat_sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  agent_name     text NOT NULL,
  adk_session_id text NOT NULL,
  title          text NOT NULL DEFAULT 'New chat',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  archived       boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, agent_name, adk_session_id)
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own chat sessions"
  ON public.chat_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat sessions"
  ON public.chat_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions"
  ON public.chat_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- No DELETE policy v1 — archive instead (retention jobs are a later module).
CREATE INDEX chat_sessions_list_idx
  ON public.chat_sessions (user_id, agent_name, archived, updated_at DESC);
```
(ON DELETE CASCADE added vs. A4's bare reference — matches the kit's own idiom
`setup.sql:26,51`; flagged. The listing index serves the newest-first panel query.)

## Files (created / modified)

| File | Action | Why |
|---|---|---|
| `supabase/chat_sessions_setup.sql` | CREATE | A4 DDL above (V1 proposal). |
| `src/types/index.ts` | MODIFY | Add `SessionIndexEntry` (id, agent_name, adk_session_id, title, created_at, updated_at, archived — NO content field; user_id stays server-side/RLS). |
| `src/services/sessionIndexService.ts` | CREATE (D1) | Mode-flagged like chatService: live → browser Supabase client (`createClient` + `auth.getUser()`); mock → in-memory index (D8). Methods per D1: `listSessions(agent)` (non-archived, newest-first), `createSession(agent, adkSessionId, title)`, `touchSession(id)`, `renameSession(id, title)`, `archiveSession(id)`. Plus exported `titleFromMessage(msg)` (D3: ~50 chars + ellipsis). Failures degrade non-blocking (console.error; chat never breaks on index trouble). |
| `src/mocks/data/sessionIndex.ts` | CREATE (D8) | In-memory store seeded to mirror the two seeded demo sessions (greeting + jarvis) + reset helper — demo flow intact. |
| `src/store/chatStore.ts` | MODIFY (D6) | The reshape above. Partialize UNTOUCHED. |
| `src/app/(cyberize)/chat/ChatPageContent.tsx` | MODIFY | Mount/agent-switch: `listSessions` → `setSessionList`; **D4 adoption** (persisted pointer with no row → `createSession("Restored chat")`); active-pointer added to the history-effect deps (session switch refetches). Send flow: on first reply birth the row (D2, `titleFromMessage(firstUserMessage)`) → `upsertSessionEntry`; later replies → `touchSession`. profileService calls removed (D1). |
| `src/components/chat/SessionPanel.tsx` | CREATE (D5) | Conversations section for the selected agent: New Chat button, newest-first list, active highlight, inline rename (pencil→input→Enter/blur), archive button per row. Existing zinc token idiom, no new deps. |
| `src/components/layout/CyberizeSidebar.tsx` | MODIFY | Render `<SessionPanel/>` under `<AgentSwitcher/>` (V4). |
| `src/__tests__/services/sessionIndexService.test.ts` | CREATE | Mock-mode CRUD: list order, create/touch/rename/archive, archived-hidden, title truncation table, index-fields-only (P-G5 scan). |
| `src/__tests__/chat/chatStore.sessions.test.ts` | CREATE | Reshape: activateSession clears messages + sets pointer; startNewChat clears pointer + loaded-empty; setSessionList/upsert; **partialize still `{agentSessions, selectedAgent}` only** (F4/P-G5 fence). |
| `src/__tests__/chat/SessionPanel.test.tsx` | CREATE | Renders list, New Chat fires startNewChat, click activates, rename commits, archive removes from list. |
| Pre-existing test edits (P-G9 — every edit listed at green board) | MODIFY | Expected: `ChatPageContent.test.tsx` (profileService mock → sessionIndexService mock; same behavioral assertions). Others expected to pass unmodified. |
| `agent_docs/CURRENT_APP/BIM004/ACCEPTANCE_SPEC.md` | CREATE at green board | P-G10. |

## P-G3 proposal

Archived sessions are **v1-hidden** (no "show archived" toggle) — documented in the
acceptance spec; recoverable later via DB or a future module. Keeps the panel simple.

## Test plan → gates

P-G1 manual (two parallel convos + reload) · P-G2 unit (row birth on first reply +
title) + manual · P-G3 unit (archive hides; rename) + manual · P-G4 **manual
two-account RLS walk** (no test-DB harness in repo — flagged) · P-G5 schema review +
mock-service field-scan unit + partialize test · P-G6 unit (adoption inserts
"Restored chat") + manual · P-G7 suites + manual mock flip · P-G8 manual (multi-bundle
agents' sessions scoped per user+agent — no collision by schema UNIQUE) · P-G9 fresh
baseline (entering 29/213) → full board, edits listed · P-G10 spec.

## Coordinator manual script (draft — final in ACCEPTANCE_SPEC)

0. Run `supabase/chat_sessions_setup.sql` in the Supabase SQL Editor once.
1. **P-G1:** live, jarvis: chat A (2 turns) → New Chat → chat B (2 turns) → switch
   A↔B freely → hard reload → both listed, both histories load.
2. **P-G2:** New Chat → empty state; first reply → exactly one new row, titled from
   your first message (~50 chars).
3. **P-G3:** rename B inline; archive A → A leaves the list.
4. **P-G6:** (before first BIM-004 use) an existing localStorage pointer appears as
   "Restored chat" with history loadable.
5. **P-G4:** log in as a second account → sees NONE of account 1's sessions.
6. **P-G7:** mock flip → panel works on the seeded in-memory index.

## Suggested commits

`BIM-004a: chat_sessions schema (A4)` · `BIM-004b: sessionIndexService + mock index +
types` · `BIM-004c: store reshape (active session per agent)` · `BIM-004d: session
panel UI + chat wiring (birth/adopt/touch)` · `BIM-004e: tests + acceptance spec + docs`

**STOP — awaiting "plan approved" + nods on: V1 standalone-SQL-file, ON DELETE CASCADE,
P-G3 v1-hidden, P-G4 manual-only RLS proof.**
