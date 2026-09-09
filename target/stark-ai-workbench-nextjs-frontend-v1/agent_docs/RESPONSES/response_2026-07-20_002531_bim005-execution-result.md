# BIM-005 — Execution Result (Engineer side COMPLETE — green board)

_2026-07-20 00:25 · Engineer: Claudy · Module: BIM-005 (Mission Control LIVE — GCS
Instructions Editor) · Branch `bim-005` (single-chat lineage)_

## GREEN BOARD

- **Entering baseline was RED as predicted** (this lineage lacked the roster-agnostic
  manifest-test repair; 6-agent manifest vs 5-pin) → repaired first (identical fix,
  re-applied). Repaired baseline green.
- **After BIM-005:** **31 suites / 232 tests green** (+2 suites: route 13, service-live
  7; +1 net on the manifest repair) · `tsc --noEmit` clean · `npm run build` clean —
  route table shows `ƒ /api/agent/instructions`.
- **C-G5 advisory grep:** `grep -rl "GCS_BUCKET|GCS_BASE_FOLDER" .next/static/` → zero
  hits (Coordinator confirms).
- **Both Mission Control components byte-untouched** — the swap happened entirely
  beneath the service seam, as designed.

## CHANGES MADE

- **DEP (I2 sanctioned):** `@google-cloud/storage@^7.21.0` — the only addition.
- **CREATE `src/app/api/agent/instructions/_lib/gcsInstructions.ts`** — client-injected
  helpers: `instructionsPath` / `backupPath` (I4 derivation, server-side only),
  `readInstructions`, `saveWithBackup` — **the backup law executable:** copy current →
  `versions/{name}.{ISO}.bak` FIRST; only a clean GCS 404 (fresh agent) skips the
  backup (`backup: null`); any other backup failure throws BEFORE any write. No delete
  capability exists.
- **CREATE `src/app/api/agent/instructions/route.ts`** (I1) — GET `?agent=` →
  `{instructions}`; PUT `{agent_name, content}` → `{ok, backup}`. Surface: 400 unknown
  agent (manifest `KNOWN_AGENTS`, zero GCS calls) · 500 naming `GCS_BUCKET` /
  `GCS_BASE_FOLDER` · 502 GCS/backup fault. `new Storage()` inside handlers — ADC
  (V4 ruling): local gcloud login in dev, attached SA deployed, zero credential env.
- **MODIFY `src/services/instructionsService.ts`** (I6) — live mode behind
  `NEXT_PUBLIC_CHAT_MODE === 'live'` (chatService pattern): GET/PUT the route, 30s
  timeouts, throw on non-OK (the existing block UI renders failures per §1.11 / its
  Alert). Mock path + signatures byte-untouched. BACKEND_SWAP_NOTES refreshed
  (sanctioned): F7 settled — direct GCS via routes, I8 last-write-wins documented.
- **MODIFY `.env.example`** — `GCS_BUCKET` + `GCS_BASE_FOLDER` structural placeholders
  + the no-credential-vars ADC note.
- **CREATE `src/__tests__/api/instructions-route.test.ts`** — 13 tests: GET happy
  (derived path asserted) / 400 unknown + missing / 500 naming each var / 502; PUT
  **backup-strictly-before-write order asserted**, backup-fail → ZERO writes (C-G3),
  clean-404 → write with `backup: null`, 400 surfaces, 500 naming.
- **CREATE `src/__tests__/services/instructionsService.live.test.ts`** — 7 tests: GET
  query + timeout signal, throw-on-non-OK, malformed-body throw, PUT body shape,
  throw-on-non-OK, mock-mode zero-fetch.
- **MODIFY `src/__tests__/config/manifest.test.ts`** — the baseline repair (re-applied
  roster-agnostic block; same rationale as on the bim-004 lineage).
- **CREATE `agent_docs/CURRENT_APP/BIM005/ACCEPTANCE_SPEC.md`** — C-G8: SA
  write-permission pre-step called out FIRST, ADC env setup, per-gate try-this steps,
  I7 risk stated plainly, I8 + no-version-browser limitations.

## THINGS I DIDN'T TOUCH

`MissionControlPageContent.tsx` + `AgentInstructionBlock.tsx` (byte-untouched) · the
chat domain entirely · stores · BIM-003 manifest/loader/routes · mocks
(`mockInstructionsStore` still powers mock mode) · kit noise.

## GATES

| Gate | Status |
|---|---|
| C-G1 | ⏳ manual (console compare) |
| C-G2 | ⏳ manual (save → console) |
| C-G3 | ✅ unit (order + abort-on-backup-fail + clean-404) · ⏳ manual `.bak` inspect |
| C-G4 | ⏳ **manual — the pirate test** |
| C-G5 | ✅ unit surfaces + build grep clean · ⏳ manual 400/500 checks |
| C-G6 | ✅ mock-mode unit + components untouched · ⏳ manual flip |
| C-G7 | ✅ repaired baseline → 31/232 · tsc · build; pre-existing edits: ONLY manifest.test.ts (listed) |
| C-G8 | ✅ ACCEPTANCE_SPEC.md delivered |

## FOR THE COORDINATOR — commits (zero git/cloud from me)

**`BIM-003fix: manifest tests roster-agnostic (re-applied on this lineage)`**
```
src/__tests__/config/manifest.test.ts
```
**`BIM-005a: GCS instructions lib + routes (backup-before-write)`**
```
src/app/api/agent/instructions/_lib/gcsInstructions.ts
src/app/api/agent/instructions/route.ts
package.json
package-lock.json
```
**`BIM-005b: instructionsService live mode`**
```
src/services/instructionsService.ts
.env.example
```
**`BIM-005c: tests + acceptance spec + docs`**
```
src/__tests__/api/instructions-route.test.ts
src/__tests__/services/instructionsService.live.test.ts
agent_docs/CURRENT_APP/BIM005/ACCEPTANCE_SPEC.md
agent_docs/RESPONSES/response_2026-07-20_001929_bim005-preflight-plan.md
agent_docs/RESPONSES/response_2026-07-20_002531_bim005-execution-result.md
session_2026-07-20.md
CHANGELOG.md
RECOVERY.md
```
(`BIM005/RETROSPECTIVE.md` at module close — seeds to record: prompt version-browser
UI, optimistic locking, the BIM-006 auth dependency.)

## MANUAL SCRIPT

Full QA version: `ACCEPTANCE_SPEC.md` §2–3. **Pre-step is load-bearing:** grant the
service account WRITE on the bucket (`roles/storage.objectUser` or equivalent) — the
existing SA is documented read-only; without the grant every save correctly fails.
Then C-G1 console compare → C-G2 save → C-G3 `.bak` → **C-G4 pirate test** → C-G5
surfaces → C-G6 mock flip.

## POTENTIAL CONCERNS

- The `.bak` timestamp uses `:` characters from ISO-8601 — legal in GCS object names;
  noted in case any downstream tooling dislikes colons (rename convention would be a
  one-line change).
- GET currently reads the object on every Mission Control mount (4 reads per page
  load) — negligible cost, no caching by design (live truth wins).
- I7 stands: the write route shares the app's current (absent) endpoint auth —
  BIM-006's mandate, stated in the spec's limitations in plain words.
