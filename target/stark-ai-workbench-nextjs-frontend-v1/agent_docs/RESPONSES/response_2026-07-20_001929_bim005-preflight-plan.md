# BIM-005 — Preflight Plan (PENDING_APPROVAL)

_2026-07-20 00:19 · Engineer: Claudy · Module: BIM-005 (Mission Control LIVE — GCS Instructions Editor)_
_Branch `bim-005` (single-chat lineage, base = BIM-003 tip). **Doc drift recorded:** the
brief's "BIM-004 merged (SATISFIED)" is false on disk — BIM-004 is parked on its own
branch by Coordinator direction; BIM-005 has zero file overlap with it and builds here._

## ⚠️ KNOWN BASELINE ISSUE (will repair first)

The roster-agnostic manifest-test repair from last night lives ONLY on branch
`bim-004`. This base carries the OLD roster-pinned `manifest.test.ts` + the 6-agent
manifest → the entering baseline will be RED with the same 2 failures. I will re-apply
the identical roster-agnostic repair here first (listed as a sanctioned pre-existing
test edit, suggested commit `BIM-003fix` as before).

## The five verifications (file:line)

**V1 — MC wiring.** `MissionControlPageContent.tsx:12-17` renders the literal 4-agent
list (deliberate §4 omission of ghl_mcp_agent — BIM-003 FLAG-A) →
`AgentInstructionBlock.tsx` per agent: fetch-on-mount (`:34-55`), textarea, save
(`:57-72`) via `instructionsService` with toast/Alert feedback. **Components talk to
the SERVICE only → I6 is a service-internal swap; both components stay
byte-untouched.**

**V2 — Path convention (I4's source of truth).** `instructionsService.ts`
BACKEND_SWAP_NOTES: read `gs://{BUCKET}/{BASE_FOLDER}/{agentName}/{agentName}_instructions.txt`,
write `upload_from_string(..., 'text/plain')`. The F7 open question (direct GCS vs
wrapper endpoint) is settled by ruling I1 — and the wrapper is retired anyway.

**V3 — Manifest roster on this page.** The committed manifest carries 6 agents. MC's
page list stays literal-4 per the standing FLAG-A ruling (not reopened here). The
ROUTES validate `agent ∈ KNOWN_AGENTS` from `src/config/manifest.ts` (I4) — any
manifest agent is servable; the page just doesn't render editors for all of them.

**V4 — Credential idiom (proposal).** **ADC, zero credential env vars.**
`new Storage()` with no options resolves Application Default Credentials: locally =
`gcloud auth application-default login` (exactly the kit's documented Local Dev auth),
deployed = the attached service account (kit's documented Production auth). No
GOOGLE_APPLICATION_CREDENTIALS juggling, no JSON-in-env risk. Env = `GCS_BUCKET` +
`GCS_BASE_FOLDER` only (AM-2 structural placeholders).

**V5 — Post-BIM-004 layout → resolves to the SINGLE-CHAT layout.** MC lives at
`(cyberize)/mission-control`; no SessionPanel, no store touchpoints — this module is
service + routes + env only. Zero store edits.

## I4 path-derivation table (server-side, client sends agent names only)

| Input | Derived object path |
|---|---|
| GET/PUT agent `X` (must be in KNOWN_AGENTS, else 400) | `{GCS_BASE_FOLDER}/X/X_instructions.txt` |
| Backup on save (I3) | `{GCS_BASE_FOLDER}/X/versions/X_instructions.txt.{ISO-timestamp}.bak` |

`encodeURIComponent` never needed server-side (paths built from validated manifest
names); the client never transmits a path (injection fence).

## Files (created / modified)

| File | Action | Why |
|---|---|---|
| `package.json` (+lock) | MODIFY | I2 sanctioned dep: `@google-cloud/storage` (server-only). The ONLY dep add. |
| `src/app/api/agent/instructions/_lib/gcsInstructions.ts` | CREATE | Storage-client-injected helpers (unit-testable without GCS): `instructionsPath`, `backupPath`, `readInstructions`, `saveWithBackup` — **backup-before-write law**: copy current → versions/…bak; ONLY a clean not-found (fresh agent, nothing to back up) skips the backup; any other backup failure ABORTS the save (no write). No delete capability exists anywhere. |
| `src/app/api/agent/instructions/route.ts` | CREATE (I1) | `GET ?agent=` → validate ∈ KNOWN_AGENTS (400) → env check (500 naming `GCS_BUCKET`/`GCS_BASE_FOLDER`) → read → `{instructions}`; GCS failure → 502. `PUT {agent_name, content}` → same validations → `saveWithBackup` → `{ok:true, backup:<path or null>}`; backup/write failure → 502. `Storage` instantiated inside handlers (ADC; test-friendly). Auth posture unchanged (I7 — risk goes in the spec). |
| `src/services/instructionsService.ts` | MODIFY (I6) | Live mode behind `NEXT_PUBLIC_CHAT_MODE === 'live'` exactly like chatService: `fetchInstructions` → GET route (30s timeout; non-OK → throw — `AgentInstructionBlock:43-51` already renders the failure per §1.11); `updateInstructions` → PUT (non-OK → throw — `:66-68` shows the Alert). Mock path + signatures byte-untouched. BACKEND_SWAP_NOTES refreshed (the swap it described is happening — same-touch sanctioned by I6's spirit; flagged here). |
| `.env.example` | MODIFY (I5) | `GCS_BUCKET=your-instructions-bucket` + `GCS_BASE_FOLDER=agent-instructions` structural placeholders + ADC comment (no credential vars — V4). |
| `src/__tests__/api/instructions-route.test.ts` | CREATE | Mocked Storage: GET happy/400-unknown/500-env-naming/502-gcs · PUT **backup-then-write ORDER asserted**, backup-fail → zero writes (C-G3 unit), clean-not-found → write with null backup, 400/500 surfaces. |
| `src/__tests__/services/instructionsService.live.test.ts` | CREATE | Live-mode fetch/update against mocked fetch (routes' shapes), throw-on-non-OK; mock-mode untouched assertions. |
| `src/__tests__/config/manifest.test.ts` | MODIFY | The baseline repair (re-applied; see ⚠️ above). |
| `agent_docs/CURRENT_APP/BIM005/ACCEPTANCE_SPEC.md` | CREATE at green board | C-G8 — MUST include the SA write-permission pre-step (existing SA documented read-only → Coordinator grants `roles/storage.objectUser` on the bucket), env setup, per-gate steps, I7 risk stated plainly, I8 last-write-wins documented. |

**NOT touched:** `MissionControlPageContent.tsx` + `AgentInstructionBlock.tsx`
(byte-untouched — the swap is beneath them) · chat domain entirely · stores ·
manifest/routes from BIM-003 · mocks (`mockInstructionsStore` keeps powering mock
mode) · kit noise.

## Test plan → gates

C-G1/2 manual (console/gsutil compare) · C-G3 unit (order + abort) + manual `.bak`
inspect · **C-G4 the pirate test — manual** · C-G5 unit surfaces + post-build grep
`.next/static/` for `GCS_` (advisory; Coordinator confirms) · C-G6 mock-mode
assertions + manual flip · C-G7 repaired baseline → full board (dep install noted) ·
C-G8 spec.

## Coordinator manual script (draft — final in ACCEPTANCE_SPEC)

0. **Pre-step (C-G8 known gap):** grant the runtime service account WRITE on the
   bucket (`roles/storage.objectUser` or equivalent). Local dev: ensure
   `gcloud auth application-default login` account can write. Set `GCS_BUCKET` +
   `GCS_BASE_FOLDER` in `.env.local`.
1. **C-G1:** Mission Control (live) shows the REAL instructions text (compare with
   the GCS console).
2. **C-G2:** edit + Save → object updated in the console.
3. **C-G3:** a `versions/` object appeared next to it, timestamped, holding the PRIOR
   text.
4. **C-G4 (the wow):** append "Always answer like a pirate." to greeting_agent → next
   chat message answers piratically. No restart. Revert, verify normalcy (a second
   `.bak` appears).
5. **C-G5:** GET with `?agent=bogus` → 400; unset `GCS_BUCKET`, restart → 500 naming
   it; restore.
6. **C-G6:** mock flip → MC behaves exactly as before this module.

## Suggested commits (zero git from me)

`BIM-003fix: manifest tests roster-agnostic (re-applied on this lineage)` ·
`BIM-005a: GCS instructions lib + routes (backup-before-write)` ·
`BIM-005b: instructionsService live mode` ·
`BIM-005c: tests + env + acceptance spec + docs`

**STOP — awaiting "plan approved" + nods on: V4 ADC idiom (zero credential env),
baseline re-repair, BACKEND_SWAP_NOTES refresh.**
