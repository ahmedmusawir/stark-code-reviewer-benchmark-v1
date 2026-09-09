# BIM-005 — ACCEPTANCE SPEC (for QA)

_2026-07-20 · Written for a QA team that has NOT read this module's internals._

## 1. What was built (plain language)

The **Mission Control** page (admin-only instruction editor) is now LIVE. It used to
edit fake in-memory text; now it reads each agent's real system instructions from the
Google Cloud Storage bucket and saves edits back. Because the agents re-read their
instructions from that bucket on **every single message**, a save changes agent
behavior immediately — no deploy, no restart.

**The backup law:** every save first copies the current instructions to a timestamped
backup file (under a `versions/` folder next to the original), and only then writes
the new text. If the backup fails, the save is refused. Nothing in this module can
delete anything.

Glossary: *GCS* = Google Cloud Storage (where instruction text files live); *ADC* =
Application Default Credentials (how the server authenticates to GCS — no keys in env
files); *mock mode* = offline demo mode (`NEXT_PUBLIC_CHAT_MODE=mock`).

## 2. Setup for QA — READ FIRST

1. **⚠️ Service-account WRITE permission (known gap):** the runtime service account
   has been documented as read-only on the bucket. Before testing saves, grant it
   write access — `roles/storage.objectUser` (or equivalent) on the bucket. For local
   dev, the account from `gcloud auth application-default login` needs the same.
   Without this: reads work, every save fails with an error Alert (which is itself
   correct error behavior, but not what you're here to test).
2. `.env.local`:
   ```
   NEXT_PUBLIC_CHAT_MODE=live
   GCS_BUCKET=<the real bucket name>
   GCS_BASE_FOLDER=<the real base folder, e.g. agent-instructions>
   ```
   There are NO credential env vars by design (ADC).
3. Object layout the server expects:
   `{GCS_BASE_FOLDER}/{agent}/{agent}_instructions.txt`
4. `npm run dev`, log in as an admin+ role, open **Mission Control**.

## 3. Expected behavior, per gate — try this

**C-G1 — live read.** Each agent block shows its REAL current instructions. Verify:
open the same object in the GCS console (or `gsutil cat`) — text matches.

**C-G2 — live save.** Edit one agent's text, click Save → success toast. Refresh the
GCS console → the object now holds your edit.

**C-G3 — the backup.** In the console, look under
`{base}/{agent}/versions/` → a new file named
`{agent}_instructions.txt.<timestamp>.bak` containing the PRIOR text. Every save adds
one. (The refuse-save-if-backup-fails path is proven by unit test — forcing a real
backup failure in the cloud isn't practical.)

**C-G4 — the wow gate.** Append "Always answer like a pirate." to greeting_agent's
instructions → Save → go to chat → send any message to greeting_agent → the reply is
piratical. No restart happened. Remove the line, save, verify normal speech returns
(and a second `.bak` appeared).

**C-G5 — error surfaces.**
- `GET /api/agent/instructions?agent=bogus` → HTTP 400 `{"error":"Unknown agent: bogus"}`.
- Unset `GCS_BUCKET`, restart, load Mission Control → each block shows its failure
  text (server returned 500 naming `GCS_BUCKET`). Restore.
- The built client bundle contains zero GCS config (verified by grep at build time;
  re-confirm if desired: `grep -rl "GCS_" .next/static/` → nothing).

**C-G6 — mock mode.** Flip `NEXT_PUBLIC_CHAT_MODE=mock`, restart → Mission Control
behaves exactly as before this module (seeded fake text, saves stick in-memory until
reload). No GCS calls at all.

## 4. Edge cases and what SHOULD happen

| Input | Expected |
|---|---|
| Agent not in the manifest | 400; nothing touched in GCS |
| First-ever save for a brand-new agent (no object yet) | Save succeeds; no `.bak` (nothing existed to back up) — response says `backup: null` |
| Backup copy fails for a real reason | Save REFUSED (502); the live object is untouched |
| GCS unreachable | Fetch shows the in-textarea error string; save shows the red Alert; app never crashes |
| Two people save at once | Last write wins (v1, documented) — both saves produce backups, so nothing is lost |

## 5. Known limitations / risks (stated plainly)

- **I7 RISK (tracked, accepted for v1):** the instructions routes carry the same auth
  posture as the rest of the app's API routes — which is to say, no dedicated
  endpoint auth yet. An instructions-WRITE endpoint is a juicier target than chat.
  Real endpoint auth is BIM-006's mandate. Until then, treat bucket write-permission
  scoping as the effective control.
- Concurrency is last-write-wins (no optimistic locking) — documented, backups make
  it survivable.
- No UI to browse/restore the `versions/` backups yet (console/gsutil only) — a
  prompt version-browser is a seeded future module.
- Mission Control still edits its documented 4-agent set; agents outside that page's
  list are servable by the API but have no editor block.
