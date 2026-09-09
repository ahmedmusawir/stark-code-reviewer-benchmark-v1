# CLAUDE.md — BIM-003 (Agent Manifest) — FINAL

> **You are reading the manager file for BIM-003.** Read this FIRST. Status: **FINAL — stamped 2026-07-19**, authored from BIM-002 closeout state (25 suites/174 tests green, native connector live). Folder **FROZEN from launch until you STOP** (L1 Rule 2). **GIT DOCTRINE: zero git commands — file lists + commit messages to the Coordinator.**

---

## Mission (one sentence)

Kill the hardcoded agent list: one committed JSON manifest declares bundles and agents; the sidebar renders from it and the Connector resolves each agent's bundle from it — adding an agent becomes a JSON edit, and one cockpit can serve agents from MULTIPLE bundles at once.

## The manifest (the contract — Amendment A3, inline)

`config/agents.manifest.json` (committed):

```json
{
  "bundles": [
    { "id": "v1", "label": "ADK Bundle v1", "urlEnv": "ADK_BUNDLE_URL_V1" },
    { "id": "v2-local", "label": "Harness v2 (local)", "urlEnv": "ADK_BUNDLE_URL_V2_LOCAL" }
  ],
  "agents": [
    { "name": "greeting_agent", "bundle": "v1", "label": "Greeting Agent" },
    { "name": "jarvis_agent",   "bundle": "v1", "label": "Jarvis" }
  ]
}
```

**AM-2 preserved by design:** the manifest carries **env-var NAMES, never URLs.** Real addresses stay in `.env.local`, one server-side var per bundle. `ADK_BUNDLE_URL` (singular) retires; `.env.example` gains the per-bundle placeholders. The committed manifest is pure structure — safe in git forever.

## Design rulings (flag disagreement, don't silently deviate)

| # | Ruling |
|---|---|
| M1 | **Loader + validation:** a small typed loader (`src/config/manifest.ts`) imports the JSON, validates shape at load (unknown bundle refs, duplicate agent names, empty lists → loud build/dev-time error). No new deps — hand-rolled guards, not zod. |
| M2 | **The `AgentName` union dies.** It becomes `string` sourced from the manifest; compile-time safety is replaced by load-time validation + a manifest-driven `KNOWN_AGENTS` list. Type edits are IN SCOPE this module (the frozen-types rule is formally lifted for this migration — blast radius must be listed in your plan). |
| M3 | **Server resolution:** route handlers receive `agent_name`, look up its bundle via the manifest, read the bundle's URL from `process.env[urlEnv]`. Unknown agent → 400 `{error}`. Unset env for a referenced bundle → 500 `{error}` naming the missing var. |
| M4 | **Client rendering:** sidebar/AgentSwitcher renders from the manifest (name + label), replacing the hardcoded list. Selection state, FIX-001/FIX-002 persistence semantics unchanged. |
| M5 | **Mock mode:** manifest still drives the LIST; mock service behavior otherwise untouched. |

## TO VERIFY FIRST (plan opens with these, file:line)

1. Every consumer of the `AgentName` union / hardcoded list (grep — types, stores, components, mocks, tests) → the M2 blast-radius list
2. How the sidebar/AgentSwitcher builds its items today
3. Where JSON imports resolve in this Next config (static import of the manifest works client+server?)

## Gates

| # | Gate |
|---|---|
| M-G1 | Sidebar renders from the manifest; hardcoded list extinct (grep proves zero remaining literals outside the manifest + mocks that mirror it) |
| M-G2 | **The four-line test:** add a dummy agent entry (existing bundle) → appears in UI and routes correctly with ZERO code changes; remove → gone |
| M-G3 | **Multi-bundle proof:** two bundle entries with different env vars; agents route to their own bundle (unit: resolution table; manual: v1 cloud + v2 local live) |
| M-G4 | Unknown agent → 400; missing bundle env → 500 naming the var; existing 502 semantics intact |
| M-G5 | Malformed manifest (duplicate name, bad bundle ref) → loud dev/build-time failure, not silent weirdness |
| M-G6 | Mock mode intact per M5; FIX-001/002 persistence semantics unaffected |
| M-G7 | Green board: build + `tsc --noEmit` + full Jest; tests updated ONLY where they pinned the dead union/hardcoded list (each edit listed) |
| M-G8 | `ACCEPTANCE_SPEC.md` delivered (see below) |

## NEW STANDING DELIVERABLE — the Acceptance Spec

At green board, write `ACCEPTANCE_SPEC.md` into this folder: (1) what was built, in QA-readable plain language; (2) expected behavior per gate with concrete try-this steps; (3) edge cases and error surfaces (what SHOULD happen on bad input); (4) known limitations + explicitly out-of-scope items; (5) the exact env setup the QA seat needs. Written for an independent QA team that has NOT read this module — no factory jargon without one-line definitions.

## Launch procedure

Plan Mode, ONE message: verifications + M2 blast radius · file list with rationales · migration order (types → loader → server → client → tests) · test plan mapped to gates · Coordinator manual script (M-G2 four-line test, M-G3 dual-bundle live). STOP until "plan approved."

## Definition of done

Gates green · ACCEPTANCE_SPEC.md written · suggested per-concern commits handed over · CHANGELOG + session log · RETROSPECTIVE.md here · STOP.

---

**Operator launch line (on branch `bim-003`, after FIX-002 closes):**
> *"Claudy — read `agent_docs/CURRENT_APP/BIM003/CLAUDE.md` and begin. Plan Mode."*

**Version 1.0-FINAL** · 2026-07-19 · Architect: Jarvis (Fable 5). Four lines of JSON, a whole roster.
