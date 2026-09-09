# CLAUDE.md — BIM-005 (Mission Control LIVE — GCS Instructions Editor) — FINAL

> **You are reading the manager file for BIM-005.** Read this FIRST. Status: **FINAL — stamped 2026-07-19.** Launch condition: BIM-004 merged (SATISFIED). Folder **FROZEN from launch until you STOP** (L1 Rule 2). **GIT DOCTRINE: zero git commands — file lists + commit messages to the Coordinator.**

---

## Mission (one sentence)

Make the Mission Control page real: read an agent's live system instructions from the GCS bucket, edit them in the UI, save them back — with an automatic timestamped backup on every save — so the agent's behavior changes on its very next message (the harness hot-reloads instructions every turn).

## Why this is safe to make live

The agents already fetch instructions from GCS **on every model run** — that hot-reload is existing, proven harness behavior. This module only adds the WRITE side, plus the one safety the Architect mandates: **no save without a backup.** A typo must never lobotomize an agent without an undo.

## Design rulings (flag disagreement, don't silently deviate)

| # | Ruling |
|---|---|
| I1 | **New server routes** under `src/app/api/agent/instructions/` — `GET ?agent=` (fetch current text) and `PUT` (save). Server-side only; GCS credentials NEVER reach the client. |
| I2 | **New dependency SANCTIONED:** `@google-cloud/storage` (server-side). The one allowed dep add; anything else needs a flag. |
| I3 | **Backup-before-write (the law):** on every save, first copy the current object to `{same-folder}/versions/{filename}.{ISO-timestamp}.bak`, THEN write the new text. Save fails if backup fails. No delete capability anywhere in this module. |
| I4 | **Path convention:** instructions objects follow the bucket layout the mocked `instructionsService` already documents (verify-first item 2 confirms exact pattern per agent, e.g. `{BASE_FOLDER}/{agent}/{agent}_instructions.txt`). Path is DERIVED server-side from the agent name via the manifest roster — the client never sends paths, only agent names (path-injection fence). Unknown agent → 400. |
| I5 | **Env (AM-2 placeholders only):** `GCS_BUCKET`, `GCS_BASE_FOLDER`, and credentials via the standard `GOOGLE_APPLICATION_CREDENTIALS` path-or-JSON idiom (verify-first item 4 picks the cleanest for this stack). Real values `.env.local` only. |
| I6 | **Service swap:** `instructionsService` gains live mode behind the existing `NEXT_PUBLIC_CHAT_MODE` flag, same pattern as chatService (mock path byte-untouched, signatures frozen). UI components rewire minimally — the Mission Control page already renders the mock flow. |
| I7 | **Auth posture unchanged** (routes as protected as the rest of the app — real endpoint auth is BIM-006). RISK, ACCEPTED, TRACKED: an instructions-write route is a juicier target than chat; note it prominently in the ACCEPTANCE_SPEC limitations. |
| I8 | **Concurrency v1:** last-write-wins, honestly documented. Optimistic locking = future garnish, OUT. |

## TO VERIFY FIRST (plan opens with these, file:line)

1. Mission Control page + `instructionsService` current wiring (components, calls, shapes)
2. The exact per-agent instructions path convention in the mock's notes/docs (I4's source of truth)
3. Manifest integration point for the agent roster on that page (post-BIM-003 reality)
4. Cleanest GCS credential idiom for this stack (path vs inline JSON env) — propose one
5. Post-BIM-004 layout: where Mission Control lives now and any store touchpoints

## Gates

| # | Gate |
|---|---|
| C-G1 | GET returns the REAL live instructions text for a manifest agent (compared against a `gsutil cat` / console view) |
| C-G2 | Edit + save → object updated in the bucket (verified in console) |
| C-G3 | **The backup law:** every save produces a timestamped `.bak` under `versions/`; a save with backup-failure forced (unit) does NOT write |
| C-G4 | **The wow gate:** change an agent's instructions ("always answer like a pirate") → next chat message obeys. No redeploy, no restart. Change it back. |
| C-G5 | Unknown agent → 400; missing env → 500 naming the var; GCS failure → 502; client bundle contains zero GCS config (grep `.next/static/`) |
| C-G6 | Mock mode: Mission Control behaves exactly as today; live mode flag-gated |
| C-G7 | Green board: build + tsc + full Jest (GCS mocked in units); pre-existing tests touched only where I6 rewiring demands (each listed) |
| C-G8 | `ACCEPTANCE_SPEC.md` delivered — MUST include: the service-account WRITE-permission setup step (known gap: the existing SA is documented read-only — granting `roles/storage.objectUser` or equivalent on the bucket is a Coordinator pre-test action), env setup, per-gate try-this steps, and the I7 risk stated plainly |

## Launch procedure

Plan Mode, ONE message: the five verifications · file list with rationales · the I4 path-derivation table (agent → object path) · credential idiom proposal · test plan mapped to gates · Coordinator manual script (C-G1/2/4 incl. the pirate test). STOP until "plan approved."

## Definition of done

Gates green · ACCEPTANCE_SPEC.md · per-concern commit suggestions · CHANGELOG + session log · RETROSPECTIVE.md (seed candidates: prompt version-browser UI, optimistic locking, BIM-006 auth dependency) · STOP.

---

**Operator launch line (on branch `bim-005`):**
> *"Claudy — read `agent_docs/CURRENT_APP/BIM005/CLAUDE.md` and begin. Plan Mode."*

**Version 1.0-FINAL** · 2026-07-19 · Architect: Jarvis (Fable 5). Live prompt surgery, with an undo.
