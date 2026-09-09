# BIM-004 — ACCEPTANCE SPEC (for QA)

_2026-07-19 · Written for a QA team that has NOT read this module's internals._

## 1. What was built (plain language)

Each agent now behaves like a **Project**: under the agent list in the sidebar there is
a **Conversations** panel for the selected agent — New Chat, a list of past
conversations (newest first, auto-titled from your first message), click to resume,
inline rename (pencil icon), and archive.

Behind it is a new database table, `chat_sessions`, that is purely an **index**: it
records WHICH conversations exist (whose, which agent, which backend session id, a
title, timestamps, an archived flag) — **it never stores what was said.** Transcripts
stay in the agent backend (ADK) and load through the same history call as before.

The browser's localStorage still remembers your last active conversation per agent
(so reload resumes where you were), but the database list is the authority.

Glossary: *session/conversation* = one chat thread with one agent; *mock mode* =
offline demo mode (`NEXT_PUBLIC_CHAT_MODE=mock`); *archive* = hide from the list
(nothing is deleted in v1).

## 2. Environment setup for QA

1. **One-time DB step:** open the Supabase SQL Editor and run the entire file
   `supabase/chat_sessions_setup.sql`. (Without it, live mode still chats fine but the
   Conversations panel stays empty and browser console shows index errors.)
2. `.env.local` as per BIM-003: `NEXT_PUBLIC_CHAT_MODE=live`, `ADK_BUNDLE_URL_V1=<real
   bundle URL>`. Two test accounts are needed for the security gate (P-G4).
3. `npm run dev`, log in, open `/chat`.

## 3. Expected behavior, per gate — try this

**P-G1 — the Projects moment.** With Jarvis selected: send 2 messages → click **New
Chat** → send 2 different messages → two entries now in Conversations → click between
them: each shows its own thread → hard reload → both still listed, the last active one
selected, its history renders; clicking the other loads its history too.

**P-G2 — row birth + title.** Click New Chat → empty "start the conversation" state,
and NO new list entry yet. Send "What is the weather like on Titan?" → after the reply,
exactly ONE new entry appears, titled with your message (long messages truncate to
~50 chars with "…").

**P-G3 — rename + archive.** Hover an entry → pencil: rename inline (Enter or click
away commits). Archive icon: the entry leaves the list. If it was the active chat, you
get a fresh New Chat state. *Archived chats are hidden in v1 — there is no
"show archived" view yet; recovery is a DB operation (documented limitation).*

**P-G4 — security (two accounts).** Log in as account B (different user): the
Conversations panel shows NONE of account A's chats, for any agent. (Enforced by
database row-level security, not just the UI.)

**P-G5 — no transcript in the index.** In Supabase → Table Editor → `chat_sessions`:
rows contain only owner, agent, session id, title, timestamps, archived. Your message
text appears ONLY in the `title` of the first message (by design — that's the
auto-title), never the conversation body.

**P-G6 — adoption of old pointers.** A browser that chatted BEFORE this module (has a
localStorage pointer but no DB rows): on first load of that agent, a "Restored chat"
entry appears and clicking it loads the old history. Nothing lost.

**P-G7 — mock mode.** Flip `NEXT_PUBLIC_CHAT_MODE=mock`, restart: the panel shows two
seeded demo conversations (greeting + jarvis agents), New Chat/rename/archive all work
in-memory, seeded demo flow intact. (Mock resets on reload — expected.)

**P-G8 — manifest harmony.** Sessions are scoped per (user, agent): agents served by
different bundles keep separate conversation lists with no collisions.

## 4. Edge cases and what SHOULD happen

| Input | Expected |
|---|---|
| Index/DB briefly unavailable | Chat keeps working; panel may show empty; console error only — never a crash or blocked send |
| New Chat then navigate away without sending | No row is ever created |
| Archive the active conversation | Panel removes it; chat area resets to New Chat state |
| Rename to empty text | Rename is ignored (title unchanged) |
| Same first message in two chats | Two rows, same title — allowed (ids differ) |

## 5. Known limitations / out of scope

- Archived conversations have no UI to view/unarchive in v1 (DB-side recoverable).
- Titles are first-message truncations; LLM-generated titles are future garnish.
- No retention/purge automation yet — the `archived` flag + timestamps are the handle
  a later module's cron will use.
- Deleting conversations is impossible by design (no DELETE policy on the table).
- profileService (the old mocked per-user map) no longer participates in chat; it
  remains in the codebase untouched for other future uses.
