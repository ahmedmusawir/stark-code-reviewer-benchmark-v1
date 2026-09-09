# CLAUDE.md — BIM-004 (Projects UX — Multi-Session Per Agent) — FINAL

> **You are reading the manager file for BIM-004.** Read this FIRST. Status: **FINAL — stamped 2026-07-19**, authored from BIM-002/003 ground + FIX-001/002 session mechanics. Folder **FROZEN from launch until you STOP** (L1 Rule 2). **GIT DOCTRINE: zero git commands.** Launch condition: **BIM-003 merged** (this module renders per-agent session lists under the manifest-driven roster).

---

## Mission (one sentence)

One agent becomes a Project: each agent gets a persistent list of conversations — sidebar with auto-titles, New Chat, click-to-resume, archive — indexed in a new Supabase `chat_sessions` table, while ADK's store remains the sole transcript truth and the frontend still never stores message content.

## Doctrine (carved in stone)

- **The index is not the transcript.** The new table stores WHICH sessions exist (owner, agent, id, title, timestamps, archived) — never message content. `getHistory` through the Connector remains the only transcript source.
- **ADK owns its rows; we own the lifecycle.** The index is the future retention handle (archive/purge jobs are LATER modules — the `archived` flag + timestamps land now, the cron does not).
- **localStorage demotes gracefully:** the FIX-001 map becomes a "last active session per agent" cache; the DB index is authority. Existing pointers get adopted, not orphaned (see D4).

## Schema (Amendment A4, inline)

```sql
create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  agent_name text not null,
  adk_session_id text not null,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived boolean not null default false,
  unique (user_id, agent_name, adk_session_id)
);
-- RLS: enable; user_id = auth.uid() for select/insert/update. No delete policy v1 (archive instead).
```

Migration file per the kit's existing DB convention (verify-first item 1). **Index columns only — a CHECK or review must confirm no content column ever sneaks in.**

## Design rulings

| # | Ruling |
|---|---|
| D1 | **New service `sessionIndexService`** (`src/services/`): `listSessions(agent)`, `createSession(agent, adkSessionId, title)`, `touchSession`, `renameSession`, `archiveSession`. Supabase client per the kit's existing pattern. `chatService` and `profileService` signatures UNTOUCHED — profileService's mocked map simply stops being load-bearing for chat (its consumers rewire to the index; the service itself is not edited). |
| D2 | **Row birth:** a session row is inserted when its FIRST successful reply returns (real `session_id` in hand) — no rows for never-sent chats. `updated_at` touched per successful exchange. |
| D3 | **Titles v1:** first user message, truncated ~50 chars, ellipsis. Rename affordance in UI (inline edit). LLM titles = future garnish, OUT. |
| D4 | **Adoption:** on first load per agent, if the FIX-001 localStorage map holds a session id with no matching row, insert a row titled "Restored chat". Nothing lost, nothing orphaned. |
| D5 | **UI shape:** per-agent session panel (list newest-first by `updated_at`, active highlighted, New Chat on top, archive via overflow/long-press-appropriate idiom, rename inline). Match existing design tokens; NO new UI deps. Selecting a session loads history through the existing flow; New Chat clears to empty state (next reply births the row per D2). |
| D6 | **Store reshape:** `agentSessions: Record<agent, sessionId>` evolves to active-session-per-agent + in-memory session list cache. Persisted (partialize) remains POINTERS ONLY — the F4 fence extends, never weakens. `messagesByAgent` keyed by (agent, activeSession) or cleared on switch — plan proposes minimal correct shape. |
| D7 | **Session id scheme unchanged** (`session-${Date.now()}` born server-side per BIM-002) — uuid migration stays deferred; the table's `adk_session_id` is text, agnostic. |
| D8 | **Mock mode:** session panel works against an in-memory index (mock sessionIndexService), demo flow intact. |

## TO VERIFY FIRST (plan opens with these, file:line)

1. The kit's DB migration convention (migrations dir vs setup SQL — where does A4's DDL live?) + existing RLS idiom to mirror
2. Supabase client + auth-user-id access pattern in this repo (auth store? helper?) — the `user_id` source for rows
3. Current `messagesByAgent`/selectedAgent shapes post-FIX-002 (the D6 reshape base)
4. Whether any existing UI region suits the session panel (sidebar? drawer?) — propose placement matching the current layout

## Gates

| # | Gate |
|---|---|
| P-G1 | Two parallel conversations with the SAME agent; switch freely; both histories intact after hard reload (the Projects moment) |
| P-G2 | New Chat → empty thread; first reply births exactly one row with a sensible auto-title |
| P-G3 | Rename + archive work; archived sessions leave the default list (and are recoverable via a "show archived" affordance or documented as v1-hidden — plan proposes) |
| P-G4 | RLS proven: user A cannot see user B's rows (test via second account or RLS unit per kit idiom) |
| P-G5 | The index table provably contains ZERO message content (schema review + a test inserting/scanning) |
| P-G6 | D4 adoption: pre-existing localStorage pointer appears as "Restored chat" with its history loadable |
| P-G7 | Mock mode: full session UX against the mock index; seeded demo intact |
| P-G8 | Manifest harmony: sessions scoped per (user, agent) across MULTIPLE bundles' agents without collision |
| P-G9 | Green board: build + tsc + full Jest; pre-existing tests modified only where the D6 reshape demands (each edit listed) |
| P-G10 | `ACCEPTANCE_SPEC.md` delivered (same standard as BIM-003: QA-readable, per-gate try-this steps, env setup, limitations) |

## Launch procedure

Plan Mode, ONE message: the four verifications · D6 reshape proposal · migration SQL exact text · file list with rationales · UI placement proposal · test plan mapped to gates · Coordinator manual script (P-G1/2/3/6 + the two-account P-G4 walk). STOP until "plan approved."

## Definition of done

Gates green · ACCEPTANCE_SPEC.md · per-concern commit suggestions (schema/service/store/UI/tests split) · CHANGELOG + session log · RETROSPECTIVE.md (flag lesson candidates; note the retention-cron seed for the ledger) · STOP.

---

**Operator launch line (on branch `bim-004`, after BIM-003 merges):**
> *"Claudy — read `agent_docs/CURRENT_APP/BIM004/CLAUDE.md` and begin. Plan Mode."*

**Version 1.0-FINAL** · 2026-07-19 · Architect: Jarvis (Fable 5). One agent, many conversations — the screenshot becomes software.
