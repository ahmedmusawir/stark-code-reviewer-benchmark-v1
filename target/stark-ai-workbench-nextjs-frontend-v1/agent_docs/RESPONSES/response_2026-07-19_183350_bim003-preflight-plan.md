# BIM-003 — Preflight Plan (PENDING_APPROVAL)

_2026-07-19 18:33 · Engineer: Claudy · Module: BIM-003 (Agent Manifest)_

## ⚠️ SEQUENCING FLAGS (surface first — Coordinator's call)

1. **Launch condition not met as written:** the manager file says launch "on branch
   `bim-003`, after FIX-002 closes." Current branch is `bim-002-2`, and BOTH FIX-002
   and FEAT-001 are engineer-complete but **uncommitted in the working tree** with a QA
   bug report incoming.
2. **File collision risk:** BIM-003 (M2 type migration) touches `chatStore.ts` and
   `MessageList.tsx` — the same files carrying uncommitted FIX-002 changes. If I build
   on this tree, FIX-002 and BIM-003 edits become inseparable in those files.
   **Recommendation: commit FIX-002a/b/c + FEAT-001a/b (file lists already delivered)
   BEFORE authorizing BIM-003 execution.** Planning is safe now; execution should wait
   for those commits (or an explicit Coordinator acceptance of a mixed tree).
3. QA's incoming FIX-002/FEAT-001 findings may target the same chat surface — worth
   sequencing the report before the type migration lands on top.

## TO-VERIFY results (file:line)

**V1 — M2 blast radius: 12 files consume `AgentName`.**
- The union itself: `src/types/index.ts:18-23` (5 literals) — referenced by `Agent`,
  `AgentSessionMap`, `RunAgentRequest`, `GetHistoryRequest` in the same file.
- Hardcoded lists (3): `AgentSwitcher.tsx:8-14` (all 5, the M4 target);
  `MissionControlPageContent.tsx:12-17` (4 agents, **deliberately omitting
  ghl_mcp_agent per DATA_CONTRACT §4** — see FLAG-A); mocks mirror the roster
  (`mocks/data/instructions.ts` keys, `mocks/data/messages.ts:17`
  `Record<AgentName, string>`, `mocks/responses.ts:39-121` switch).
- Signature/prop consumers (compile-through, no behavior): `chatStore.ts` (8 sites +
  `DEFAULT_AGENT:20`), `instructionsService.ts:21,32`, `MessageBubble.tsx:20`,
  `MessageList.tsx:146`, `AgentInstructionBlock.tsx:13`,
  `services.contract.test.ts:19`.

**V2 — Sidebar today:** `AgentSwitcher.tsx:8-14` — local `AGENTS: AgentName[]` array,
rendered at `:36-53` (button label = raw name, font-mono; no label concept yet).

**V3 — JSON imports:** `tsconfig.json:16` `"resolveJsonModule": true` +
`esModuleInterop` — static `import manifest from "@/../config/agents.manifest.json"`
resolves client+server in Next 16 (bundled at build; no fs at runtime). `config/` dir
does not exist yet (will be created).

**Extra finding:** `mocks/responses.ts` switch has **NO default case** — with the union
dead, a manifest-added agent returns `undefined` in mock mode (breaks M-G2's spirit in
mock). A generic default branch is a REQUIRED small mock edit (M5-compatible).

## FLAGS FOR RULING

- **FLAG-A (Mission Control):** M4 names only sidebar/AgentSwitcher. Mission Control's
  4-agent list is a *documented deliberate omission* (DATA_CONTRACT §4 preserves the
  Streamlit drift). Proposal: MC keeps its literal list this module (typed `string[]`),
  NOT manifest-driven — changing §4 behavior is out of scope. Flagged so it's a ruling,
  not a silent choice.
- **FLAG-B (default agent):** `DEFAULT_AGENT = "greeting_agent"` hardcoded in
  chatStore. Proposal: default = **first agent in the manifest** (manifest order is
  meaningful); FIX-002 restore semantics unchanged (persisted selection still wins).
- **FLAG-C (shipped manifest content):** the brief's inline example lists 2 agents.
  Proposal: ship ALL FIVE existing agents on bundle `v1` (`ADK_BUNDLE_URL_V1`) +
  declare bundle `v2-local` (`ADK_BUNDLE_URL_V2_LOCAL`) with zero agents — it exists
  for the M-G3 dual-bundle manual (Coordinator re-points an agent by editing JSON).
  Labels: "Greeting Agent", "Jarvis", "Calc Agent", "Product Agent", "GHL CRM Agent".

## Files (created / modified)

| File | Action | Why |
|---|---|---|
| `config/agents.manifest.json` | CREATE | The committed contract (FLAG-C content). Env-var NAMES only — AM-2 holds. |
| `src/config/manifest.ts` | CREATE | M1 loader: static JSON import + hand-rolled `validateManifest(data)` (throws listing ALL problems: empty lists, duplicate agent names/bundle ids, unknown bundle refs, missing fields); exports `MANIFEST`, `KNOWN_AGENTS: string[]`, `DEFAULT_AGENT`, `agentsForUi(): {name,label}[]`, `resolveBundleEnvVar(agentName): string \| null`. Validation runs at module load → loud dev/build failure (M-G5). |
| `src/types/index.ts` | MODIFY (M2) | `AgentName` union → `export type AgentName = string` + doc comment pointing at the manifest. Alias survives so all 12 consumers compile unchanged — the union dies, the name stays. |
| `src/app/api/agent/run/route.ts` + `history/route.ts` | MODIFY (M3) | Resolve per request: parse body → unknown `agent_name` → **400** `{error}` (before any fetch) → `resolveBundleEnvVar` → `process.env[thatVar]` unset → **500 naming the var**. 502 semantics + `_lib/adk.ts` untouched (baseUrl still injected via ctx). Singular `ADK_BUNDLE_URL` retires. |
| `src/components/chat/AgentSwitcher.tsx` | MODIFY (M4) | Render `agentsForUi()` (label shown, name = identity). Selection/persistence semantics untouched. |
| `src/store/chatStore.ts` | MODIFY (minimal) | `DEFAULT_AGENT` imports from the loader (FLAG-B). Nothing else — persist/partialize (FIX-001/002) untouched. |
| `src/app/(cyberize)/mission-control/MissionControlPageContent.tsx` | MODIFY (type-only per FLAG-A) | List stays literal; type annotation survives via alias (may need zero edits — listed for honesty). |
| `src/mocks/responses.ts` | MODIFY | Add `default:` generic agent-voiced echo (required for M-G2 in mock). Existing 5 cases byte-identical. |
| `.env.example` | MODIFY | `ADK_BUNDLE_URL` out; `ADK_BUNDLE_URL_V1` + `ADK_BUNDLE_URL_V2_LOCAL` placeholders in (structural only). |
| `src/__tests__/config/manifest.test.ts` | CREATE | Validator table (M-G5): duplicates, unknown bundle ref, empty lists, missing fields → throws naming the problem; resolution table (M-G3 unit): two bundles → correct env var per agent; committed manifest passes validation. |
| `src/__tests__/api/agent-run.test.ts` + `agent-history.test.ts` | MODIFY (M-G7 sanctioned) | Env pins `ADK_BUNDLE_URL` → `ADK_BUNDLE_URL_V1`; NEW cases: unknown agent → 400 zero-HTTP; missing bundle env → 500 naming var. All other assertions preserved. |
| `agent_docs/CURRENT_APP/BIM003/ACCEPTANCE_SPEC.md` | CREATE at green board | M-G8 standing deliverable (QA-readable). |

**NOT touched:** `_lib/adk.ts`, chatService, ChatPageContent, MessageActions/speech
(FEAT-001), profile/instructions services' behavior, persist semantics, auth, kit noise.

## Migration order (per launch procedure)

types (alias) → loader+manifest (+validator tests) → server (routes + route tests) →
client (AgentSwitcher, chatStore default, mock default) → sweep tests + M-G1 grep proof
→ green board → ACCEPTANCE_SPEC.md.

## Test plan → gates

M-G1 grep: zero agent literals outside manifest/mocks/MC-list (+ the M-G1 proof grep
run in the report) · M-G2 manual four-line test (+ mock default unit) · M-G3 unit
resolution table + manual dual-bundle · M-G4 unit 400/500-naming-var/502 intact ·
M-G5 validator unit table · M-G6 suites + manual mock flip; persistence untouched ·
M-G7 fresh baseline (entering 28/197) → full board; every sanctioned test edit listed ·
M-G8 ACCEPTANCE_SPEC.md.

## Coordinator manual script (draft — final version lands in ACCEPTANCE_SPEC.md)

1. `.env.local`: rename `ADK_BUNDLE_URL` → `ADK_BUNDLE_URL_V1`. Live chat works as
   before (all 5 agents, labels in sidebar).
2. **M-G2:** add `{ "name": "test_dummy_agent", "bundle": "v1", "label": "Dummy" }` to
   the manifest → restart dev → Dummy appears in sidebar, chats against v1 live.
   Remove → gone. Zero code edits.
3. **M-G3:** run a local ADK api_server; set `ADK_BUNDLE_URL_V2_LOCAL`; edit one
   agent's `"bundle"` to `"v2-local"` → it chats against the local bundle while others
   stay on v1 cloud.
4. **M-G4:** POST `/api/agent/run` with a bogus agent_name → 400; unset
   `ADK_BUNDLE_URL_V1` → 500 naming that var; sentinel bubble intact.
5. **M-G5:** duplicate an agent name in the manifest → dev server fails loudly on load.
6. **M-G6:** mock flip → list still manifest-driven, seeded flows intact.

## Suggested commits (zero git from me)

- `BIM-003a: agent manifest + validated loader`
- `BIM-003b: routes resolve bundles from the manifest (400/500 surfaces)`
- `BIM-003c: manifest-driven sidebar; AgentName union retired`
- `BIM-003d: acceptance spec + docs`

**STOP — awaiting "plan approved" + rulings on FLAG-A/B/C + the sequencing call
(commit FIX-002/FEAT-001 first?).**
