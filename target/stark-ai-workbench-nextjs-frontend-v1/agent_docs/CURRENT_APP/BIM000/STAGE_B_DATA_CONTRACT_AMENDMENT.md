# BIM-001 — STAGE B: DATA_CONTRACT AMENDMENT A1
## Chat Domain: Mock → Live via Route-Handler Seam

> Amends `_project/DATA_CONTRACT.md` §1.4–§1.6, §2.2, §3.4 for the chat domain only.
> Profile (§2.3) and Instructions (§2.4) contracts are **unchanged and remain mocked**.
> Status: REVIEW · Authored: 2026-07-10 · **v1.1:** part of the unified BIM-001 module (`agent_docs/CURRENT_APP/BIM001/`); read `CLAUDE.md` first. During Stage A this file is a CLAIM SOURCE only.

---

## A1.1 — The Seam (One Doctrine Change, Stated Plainly)

**Old contract (BACKEND_SWAP_NOTES in `chatService.ts`):** service methods call the wrapper directly (`POST {WRAPPER_URL}/run_agent`).

**Amended contract:** service methods call **internal Next.js route handlers**, which proxy to the wrapper server-side.

```
BEFORE (as prescribed):  chatService ──▶ Python Wrapper ──▶ ADK Bundle
AFTER  (this amendment): chatService ──▶ /api/agent/* ──▶ Python Wrapper ──▶ ADK Bundle
                                          └── the BIM seam: Phase B swaps ONLY this box
```

**Why the amendment (three reasons, one sentence each):**
1. **No CORS** — browser never crosses origins; the proxy call is server-to-server.
2. **No leaked infrastructure** — `ADK_WRAPPER_URL` stays server-side, out of the client bundle.
3. **Phase B becomes invisible** — when the wrapper dies, only route handler internals change; `chatService` and every component above it never know.

This amendment is logged here explicitly so the old BACKEND_SWAP_NOTES don't become a phantom reference. Claudy updates the notes block in `chatService.ts` as part of the wave.

## A1.2 — Route Handler Contracts (Thin Proxy Doctrine)

Phase A route handlers are **verbatim proxies**. They add zero intelligence: no session logic, no response reshaping beyond pass-through, no retries. All smarts stay in the wrapper until Phase B deliberately ports them. A thin proxy in Phase A is a clean diff in Phase B.

### `POST /api/agent/run`
- **Accepts:** `RunAgentRequest` — `{ agent_name, message, user_id, session_id }` (snake_case preserved per §1.4)
- **Does:** forwards body verbatim to `{ADK_WRAPPER_URL}/run_agent`; 90s timeout; passes through optional `Authorization` header (reserved auth slot)
- **Returns:** wrapper's JSON verbatim — `{ response: string, session_id: string }` (§1.5)
- **On wrapper error/unreachable:** returns HTTP 502 with `{ error: string }` — the *service layer*, not the route, converts this to the UI sentinel (division of labor: routes speak HTTP, services speak contract)

### `POST /api/agent/history`
- **Accepts:** `GetHistoryRequest` — `{ agent_name, user_id, session_id }` (§1.6)
- **Does:** forwards verbatim to `{ADK_WRAPPER_URL}/get_history`; 30s timeout; same auth pass-through
- **Returns:** wrapper's JSON verbatim — `{ history: Message[] }` where `Message = { role, content }`
- **Note:** `chatService.getHistory` unwraps `.history` and returns `Message[]` (its signature is unchanged)

## A1.3 — chatService Live-Mode Behavior

| Method | Mode flag = `mock` (or unset) | Mode flag = `live` |
|--------|-------------------------------|--------------------|
| `sendMessage` | Existing mock path, untouched | `fetch('/api/agent/run')`, 90s budget |
| `getHistory` | Existing mock path, untouched | **Guard first:** falsy `session_id` → return `[]`, zero HTTP. Else `fetch('/api/agent/history')`, unwrap `.history` |

Flag: `NEXT_PUBLIC_CHAT_MODE` ∈ {`mock`, `live`}; any other value → `mock`. Fail-safe default: the app must never accidentally ship live-wired.

## A1.4 — Error Contract (and the One Known Conflict)

Per original §1.5, on client-side failure `sendMessage` resolves (does not throw) with:

```
{ response: "Error: Could not reach Agent Wrapper. Details: <e>", session_id: <see conflict> }
```

**KNOWN CONFLICT — Claudy must surface this in Plan Mode:**
BACKEND_SWAP_NOTES say the sentinel carries `session_id: undefined`; the type `RunAgentResponse.session_id` is `string`. Options Claudy may propose (Architect pre-assessment attached):

| Option | Change | Jarvis's read |
|--------|--------|---------------|
| (a) Widen type to `string \| undefined` | Types file + any narrow consumers | Honest, but touches shared types — check blast radius on the store |
| (b) Sentinel echoes the request's `session_id ?? ''` | chatService only | Smallest diff; preserves session continuity across a transient failure |
| (c) Discriminated result type | Types + service + store | Cleanest long-term, biggest diff — smells like Phase B work |

Architect's default lean: **(b)**, but the Coordinator decides at plan review. Per doctrine: conflict flagged, not silently resolved.

`getHistory` failure behavior: return `[]` and `console.error` — history fetch failure must never block chat.

## A1.5 — Environment

| Var | Side | Example | Notes |
|-----|------|---------|-------|
| `ADK_WRAPPER_URL` | Server only | `https://adk-wrapper-prod-v2-952978338090.us-east1.run.app` | Real value in `.env.local` / host config only — **never committed**. `.env.example` gets a placeholder. |
| `NEXT_PUBLIC_CHAT_MODE` | Client | `mock` | Default-safe |

## A1.6 — What Phase B Will Swap (Recorded Now, Built Later)

The route handlers' internals become the port target: wrapper's `create_session` (`POST /apps/{app}/users/{user}/sessions/{id}`), the 404→create→retry-once loop, and reversed-event-array parsing for the final `model` text part (all confirmed in wrapper `main.py`). The route handler **signatures above do not change** in Phase B. That is the whole point of Phase A.

**Version:** A1 · applies on top of DATA_CONTRACT.md as of 2026-07-10
