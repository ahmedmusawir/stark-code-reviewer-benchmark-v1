# BIM-003 — ACCEPTANCE SPEC (for QA)

_2026-07-19 · Written for a QA team that has NOT read this module's internals._

## 1. What was built (plain language)

The list of chat agents used to be hardcoded in the app's source code. Now it lives in
**one committed JSON file**: `config/agents.manifest.json`. That file declares:
- **bundles** — backend agent servers. Each bundle names an environment variable
  (e.g. `ADK_BUNDLE_URL_V1`) that holds its real URL. The URL itself is NEVER in the
  JSON — it lives only in `.env.local` on the machine running the app.
- **agents** — each with a machine `name`, the `bundle` that serves it, and a human
  `label` shown in the sidebar.

The sidebar renders whatever the manifest declares. The server looks up each incoming
chat request's agent in the manifest to decide which backend to call. **Adding an agent
is now a JSON edit — zero code changes.** Different agents can be served by different
backends at the same time.

Glossary: *bundle* = a deployed ADK agent server; *mock mode* = the app's offline demo
mode (`NEXT_PUBLIC_CHAT_MODE=mock`), which fakes agent replies locally.

## 2. Environment setup for QA

In `.env.local`:
```
NEXT_PUBLIC_CHAT_MODE=live
ADK_BUNDLE_URL_V1=<the real cloud bundle URL>        # required for live tests
ADK_BUNDLE_URL_V2_LOCAL=http://127.0.0.1:8000        # only for the dual-bundle test
```
The old `ADK_BUNDLE_URL` (no suffix) is RETIRED — if your `.env.local` still has it,
rename it to `ADK_BUNDLE_URL_V1`. Restart the dev server after ANY manifest or env
edit (`npm run dev`).

## 3. Expected behavior, per gate — try this

**G1 — sidebar comes from the manifest.** Open the app: the sidebar shows five agents
by their labels ("Greeting Agent", "Jarvis", "Calc Agent", "Product Agent",
"GHL CRM Agent"). Chat works as before with each.

**G2 — the four-line test.** Add to the `agents` array in
`config/agents.manifest.json`:
```json
{ "name": "test_dummy_agent", "bundle": "v1", "label": "Dummy" }
```
Restart dev. EXPECT: "Dummy" appears in the sidebar; selecting it and sending a
message reaches the v1 backend (the backend will answer or error per its own config —
reaching it is the pass). Remove the line, restart. EXPECT: gone. Zero code changed.

**G3 — two backends at once.** Run a local ADK `api_server` on port 8000. Set
`ADK_BUNDLE_URL_V2_LOCAL`. Edit ONE agent's `"bundle"` to `"v2-local"`, restart.
EXPECT: that agent's chats hit the local server (watch its console); every other agent
still uses the cloud bundle. Revert after.

**G4 — error surfaces.**
- POST `/api/agent/run` with a made-up `agent_name` → **HTTP 400**
  `{"error":"Unknown agent: <name>"}` — the server calls no backend.
- Remove `ADK_BUNDLE_URL_V1` from `.env.local`, restart, send a chat → **HTTP 500**
  `{"error":"ADK_BUNDLE_URL_V1 is not configured"}` — the error NAMES the missing
  variable. The chat UI shows its normal error bubble ("Could not reach Agent
  Service…"), never a crash. Restore the var.
- Backend down/unreachable → HTTP 502 + the same error bubble (unchanged from before).

**G5 — a broken manifest fails loudly.** Duplicate an agent name in the JSON (or point
an agent at a bundle id that doesn't exist), restart dev. EXPECT: the app FAILS TO
START with an error listing exactly what's wrong in the manifest. Fix it; app starts.

**G6 — mock mode intact.** Set `NEXT_PUBLIC_CHAT_MODE=mock`, restart. EXPECT: the
sidebar still lists the manifest agents; the five original agents give their scripted
demo replies; a manifest-added agent (G2 dummy) gives a generic mock reply. Selected
agent + sessions still survive a reload (prior FIX-002/FIX-001 behavior unchanged).

## 4. Edge cases and what SHOULD happen

| Input | Expected |
|---|---|
| Agent name not in manifest (API level) | 400, error says "Unknown agent", no backend call |
| Manifest bundle's env var unset | 500, error NAMES the variable |
| Backend unreachable | 502; chat shows the error bubble; UI keeps working |
| Duplicate agent name / bad bundle ref / empty lists in JSON | dev server / build refuses to start, lists every problem |
| Reload mid-chat | same agent selected, history reloads (unchanged FIX-001/002 behavior) |

## 5. Known limitations / out of scope

- **Mission Control** still manages its fixed set of 4 agents (deliberate, documented
  in the data contract) — it is NOT manifest-driven this module.
- Manifest edits need a dev-server restart (the file is read at build/boot, not
  watched live).
- A removed agent's saved session/pointer in the browser is simply ignored (no
  cleanup UI).
- No auth on the API routes yet (tracked, deferred — pre-existing).
- The two shipped bundles are `v1` (cloud) and `v2-local` (for testing); more can be
  added by editing the manifest + adding the matching env var.
