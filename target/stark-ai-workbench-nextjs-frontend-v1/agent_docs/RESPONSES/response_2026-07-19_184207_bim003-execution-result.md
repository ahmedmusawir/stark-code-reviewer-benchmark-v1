# BIM-003 — Execution Result (Engineer side COMPLETE — green board)

_2026-07-19 18:42 · Engineer: Claudy · Module: BIM-003 (Agent Manifest)_
_FLAG-A/B/C accepted with approval; sequencing resolved by Coordinator commit `f03f08c`
(tree was clean before my first edit — BIM-003 changes are cleanly separable)._

## GREEN BOARD

- **Baseline (fresh):** 28 suites / 197 tests green.
- **After:** **29 suites / 213 tests green** (+1 suite, +16 tests) · `tsc --noEmit`
  clean · `npm run build` clean.
- **M-G1 proof grep:** zero agent-name literals in src outside the manifest, mocks,
  and Mission Control's documented list (command + empty result in session log).

## CHANGES MADE

- **CREATE `config/agents.manifest.json`** — 2 bundles (`v1` → `ADK_BUNDLE_URL_V1`,
  `v2-local` → `ADK_BUNDLE_URL_V2_LOCAL`), all 5 roster agents on `v1` with human
  labels (FLAG-C). Env-var NAMES only — AM-2 holds.
- **CREATE `src/config/manifest.ts`** — M1 loader: static JSON import; hand-rolled
  `validateManifest` throws ONE error listing EVERY problem (empty lists, duplicate
  agent/bundle ids, unknown bundle refs, missing/empty fields); runs at module load →
  loud dev/build failure (M-G5). Exports `MANIFEST`, `KNOWN_AGENTS`, `DEFAULT_AGENT`
  (first manifest agent, FLAG-B), `agentsForUi()`, `resolveBundleEnvVar()` +
  pure `resolveBundleEnvVarIn()` for unit tables.
- **MODIFY `src/types/index.ts`** — the `AgentName` union is dead:
  `export type AgentName = string` + doc comment pointing at the manifest. The alias
  survives, so all 12 consumers compiled without edits (M2 blast radius realized:
  2 files with actual behavior changes, listed below; the rest untouched).
- **MODIFY both route handlers (M3)** — per request: unknown agent → **400** (zero
  HTTP); bundle env var unset → **500 naming the var**; else prior BIM-002 flow
  (`_lib/adk.ts` byte-untouched, 502 semantics intact). Singular `ADK_BUNDLE_URL`
  retired from code.
- **MODIFY `src/components/chat/AgentSwitcher.tsx` (M4)** — renders `agentsForUi()`:
  label is what humans see, name is identity. Selection/persistence untouched.
- **MODIFY `src/store/chatStore.ts`** — `DEFAULT_AGENT` now imported from the loader
  (FLAG-B). One line + comment; persist/partialize (FIX-001/002) untouched.
- **MODIFY `src/mocks/responses.ts`** — new `default:` generic agent-voiced branch
  (required so manifest-added agents work in mock — M-G2/M5). Existing 5 cases
  byte-identical.
- **MODIFY `.env.example`** — `ADK_BUNDLE_URL` out; `ADK_BUNDLE_URL_V1` +
  `ADK_BUNDLE_URL_V2_LOCAL` placeholders in.
- **CREATE `src/__tests__/config/manifest.test.ts`** — 14 tests: validator table
  (duplicates, unknown refs, empty lists, field paths, all-problems-in-one-throw,
  non-object), resolution table (two bundles → own env vars; unknown → null),
  committed-manifest checks (roster, default, labels, AM-2 no-URLs).
- **MODIFY route tests (M-G7 sanctioned, every edit listed):**
  `agent-run.test.ts` + `agent-history.test.ts` — env pin `ADK_BUNDLE_URL` →
  `ADK_BUNDLE_URL_V1` (7 sites each, incl. the 500-message literal); NEW 400
  unknown-agent zero-HTTP case in each. `AgentSwitcher.test.tsx` — pinned the dead
  hardcoded list; now asserts manifest labels + name-on-click (2 tests rewritten).
- **CREATE `agent_docs/CURRENT_APP/BIM003/ACCEPTANCE_SPEC.md`** — M-G8 (QA-readable).

## THINGS I DIDN'T TOUCH

`_lib/adk.ts` · chatService · ChatPageContent/MessageList/MessageBubble/MessageActions
· speech.ts (FEAT-001) · persist semantics · Mission Control's 4-agent list (FLAG-A:
documented §4 drift preserved; compiles via the alias, zero edits needed) · services
behavior · kit noise.

## GATES

| Gate | Status |
|---|---|
| M-G1 | ✅ grep proof empty |
| M-G2 | ✅ mock default unit · ⏳ Coordinator four-line test (spec §3-G2) |
| M-G3 | ✅ unit resolution table · ⏳ manual dual-bundle (spec §3-G3) |
| M-G4 | ✅ unit 400 / 500-naming-var / 502 intact · ⏳ manual |
| M-G5 | ✅ validator unit table · ⏳ manual duplicate-name check |
| M-G6 | ✅ suites green · ⏳ manual mock flip |
| M-G7 | ✅ baseline 28/197 → 29/213 · tsc · build; sanctioned test edits all listed above |
| M-G8 | ✅ ACCEPTANCE_SPEC.md delivered |

## FOR THE COORDINATOR — commits (zero git/cloud from me)

**`BIM-003a: agent manifest + validated loader`**
```
config/agents.manifest.json
src/config/manifest.ts
src/__tests__/config/manifest.test.ts
```
**`BIM-003b: routes resolve bundles from the manifest (400/500 surfaces)`**
```
src/app/api/agent/run/route.ts
src/app/api/agent/history/route.ts
src/__tests__/api/agent-run.test.ts
src/__tests__/api/agent-history.test.ts
.env.example
```
**`BIM-003c: manifest-driven sidebar; AgentName union retired`**
```
src/types/index.ts
src/components/chat/AgentSwitcher.tsx
src/store/chatStore.ts
src/mocks/responses.ts
src/__tests__/chat/AgentSwitcher.test.tsx
```
**`BIM-003d: acceptance spec + docs`**
```
agent_docs/CURRENT_APP/BIM003/ACCEPTANCE_SPEC.md
agent_docs/RESPONSES/response_2026-07-19_183350_bim003-preflight-plan.md
agent_docs/RESPONSES/response_2026-07-19_184207_bim003-execution-result.md
session_2026-07-19.md
CHANGELOG.md
RECOVERY.md
```
(`BIM003/RETROSPECTIVE.md` at module close after the manual pass.)

## MANUAL SCRIPT

The full QA-facing version is `ACCEPTANCE_SPEC.md` §2–3 (env rename → G2 four-line
test → G3 dual-bundle → G4 error surfaces → G5 loud-failure → G6 mock flip).
**First step matters: rename `ADK_BUNDLE_URL` → `ADK_BUNDLE_URL_V1` in `.env.local`
or every live chat 500s (naming the var, as designed).**

## POTENTIAL CONCERNS

- Manifest edits require a dev-server restart (static import — documented in the spec).
- The validator runs wherever the loader is imported (client bundle included via
  AgentSwitcher/chatStore) — a bad manifest fails client AND server loudly; that is
  the intended M-G5 behavior.
- QA's incoming FIX-002/FEAT-001 bug report may interleave with this module's manual
  pass — BIM-003 files are disjoint from those modules except `chatStore.ts` (one
  line) and the route tests; conflicts unlikely but the report should be sequenced
  before commits if it lands first.
