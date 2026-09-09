# BIM-001 "Prove the Wire" — Implementation Plan

> **Status:** PENDING_APPROVAL — awaiting Architect (Jarvis) QA relay + Coordinator "plan approved."
> Logged: 2026-07-16 19:16:53 (post-display, on Operator recovery cue — protocol miss acknowledged)

## Context

Run 001 (FFM) shipped the chat UI against a fully mocked service layer, promising: *"when the operator swaps the service layer to real backend, no component changes."* BIM-001 executes that swap for the **chat domain only**: `chatService.sendMessage`/`getHistory` gain a live mode that calls two new server-side Next.js proxy routes, which forward verbatim to the deployed Python ADK wrapper on Cloud Run. Mock mode stays the fail-safe default behind `NEXT_PUBLIC_CHAT_MODE`. All decisions are pre-ruled: D1(b) sentinel echo, AM-1 lint-free green board, AM-2 URL redaction. Local dev only; wrapper and ADK bundle frozen.

## Files to CREATE

| File | Purpose |
|---|---|
| `src/app/api/agent/run/route.ts` | Thin proxy: `POST` → `{ADK_WRAPPER_URL}/run_agent`, 90s timeout, `maxDuration = 90` |
| `src/app/api/agent/history/route.ts` | Thin proxy: `POST` → `{ADK_WRAPPER_URL}/get_history`, 30s timeout |
| `src/__tests__/api/agent-run.test.ts` | Route unit tests (fetch mocked) |
| `src/__tests__/api/agent-history.test.ts` | Route unit tests (fetch mocked) |
| `src/__tests__/services/chatService.live.test.ts` | Live-mode service tests (fetch mocked) |
| `agent_docs/CURRENT_APP/BIM001/RETROSPECTIVE.md` | At completion (the one sanctioned write into the module folder) |

## Files to MODIFY

| File | Change |
|---|---|
| `src/services/chatService.ts` | Add mode branch; live bodies per Amendment §A1.3/§A1.4; rewrite `BACKEND_SWAP_NOTES` (seam now `/api/agent/*`, D1 wording corrected `undefined` → `?? ''`) |
| `.env.example` | Add `ADK_WRAPPER_URL` (placeholder only — AM-2) + `NEXT_PUBLIC_CHAT_MODE=mock` |
| `CHANGELOG.md`, `session_2026-07-16.md`, `RECOVERY.md` | Repo protocol |

## Files I will NOT touch

- Components, stores, pages, layouts, `src/types/index.ts` (D1(b) = zero type changes) — forbidden zone
- `profileService`, `instructionsService` — stay mocked
- `src/__tests__/services/services.contract.test.ts`, `ChatPageContent.test.tsx` — must pass **unmodified** (G2)
- `src/app/api/auth/*` (incl. the orphan `route-1.ts` — logged, not mine to clean), proxy, supabase utils
- Wrapper / ADK bundle repos — frozen

## Design

### Route handlers (thin-proxy doctrine, §A1.2)

Both handlers identical in shape, differing only in path + timeout:

```
POST body (raw text, forwarded verbatim — zero reshaping)
  → fetch(`${process.env.ADK_WRAPPER_URL}/run_agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) },
      body,
      signal: AbortSignal.timeout(90_000),   // 30_000 for history
    })
  → return new NextResponse(await upstream.text(), { status: upstream.status, headers: {'Content-Type':'application/json'} })
```

- Handler signature takes a plain `Request` (all we need is `.text()` + `.headers.get()`) — directly testable with `new Request(...)` under Jest's node env (Node 24 has global fetch/Request/Response and `AbortSignal.timeout`).
- **Auth slot:** pass through `Authorization` header if present (Brief §7 — one line now).
- **Unreachable/timeout (fetch throws):** `502 { error: String(e) }` per §A1.2.
- **`ADK_WRAPPER_URL` unset:** `500 { error: 'ADK_WRAPPER_URL is not configured' }` — config fault, not upstream fault. (Only deviation candidate from the amendment, which defines only the 502 case; service converts any non-ok to the sentinel either way. Flagging per doctrine, will use 502 if Architect prefers a single error status.)
- `export const maxDuration = 90` on the run route: hosting target is unconfirmed (Brief §9 checkbox); one line makes a future Vercel deploy not silently kill 60s wrapper calls. Harmless locally.
- Wrapper's real URL never appears in code, docs, tests, or commits (AM-2) — placeholder in `.env.example`, real value only in `.env.local` (Tony adds it by hand; currently absent — verified).

### chatService live mode (§A1.3, D1(b))

Flag read at call time so Jest can flip it per-test; Next statically inlines `process.env.NEXT_PUBLIC_CHAT_MODE` in the client bundle either way:

```ts
const isLive = () => process.env.NEXT_PUBLIC_CHAT_MODE === 'live';   // anything else → mock (fail-safe)
```

- `sendMessage` live: `fetch('/api/agent/run', …, AbortSignal.timeout(90_000))`; non-ok → throw into catch; `response` field defaults to `"Error: No response content."` if missing (SWAP_NOTES rule preserved). **Catch resolves (never throws) with the D1(b) sentinel:**
  `{ response: "Error: Could not reach Agent Wrapper. Details: " + e, session_id: input.session_id ?? '' }` — type-safe against `RunAgentResponse.session_id: string`, zero shared-type changes, session thread survives transient failure.
- `getHistory` live: **guard first** — falsy `session_id` → return `[]`, zero HTTP (G7). Else `fetch('/api/agent/history', …, 30s)`, unwrap `.history`. Any failure → `console.error` + `[]` (history must never block chat).
- Mock paths: byte-for-byte untouched, still the default.

## Test plan → gates

| Gate | Covered by |
|---|---|
| G1 | Stage A health check (2026-07-16, same day — <48h, no re-verify needed) |
| G2 | Existing `services.contract.test.ts` + `ChatPageContent.test.tsx` pass **unmodified** |
| G3 | Live-suite cases: flag unset and flag=`garbage` → mock path, zero fetch calls |
| G7 | Live-suite case: falsy `session_id` → `[]`, `fetch` mock asserted 0 calls |
| G8 | Live-suite case: fetch rejects → resolves with sentinel string + echoed `session_id ?? ''`; route tests: upstream throw → 502 `{error}` (+ manual script below) |
| G10 | `npm run build` + `npx tsc --noEmit` + full Jest suite (AM-1: no lint) |
| — | Route tests: verbatim body forward, correct upstream URL/timeout, status pass-through, Authorization pass-through present/absent, missing-env 500 |
| — | Live-suite: sendMessage happy path hits `/api/agent/run`; getHistory unwraps `.history` |

**Regression rule confirmed:** full suite (20 suites / 121 tests) + tsc + build run **before the first change** (baseline) and **after the last change** (green board). Existing tests run with the flag unset, so mock default keeps them green untouched.

## Manual verification script for Tony (G4/G5/G6/G9)

1. `.env.local`: add `ADK_WRAPPER_URL=<real wrapper URL>` (server-side, no NEXT_PUBLIC) and `NEXT_PUBLIC_CHAT_MODE=live`. Restart `npm run dev`.
2. **G4:** open chat, select `jarvis_agent`, send a real message → real ADK response renders.
3. **G5:** send a second message in the same session → watch dev-tools Network: second `POST /api/agent/run` body carries the `session_id` returned by the first (also: no new session row created wrapper-side).
4. **G6:** reload the page → prior turns render (history fetched with the live `session_id`).
5. **G8 (spot check):** set `ADK_WRAPPER_URL` to an unreachable host, restart, send → assistant-style bubble `"Error: Could not reach Agent Wrapper. Details: …"`, UI alive.
6. **G9:** `npm run build`, then `grep -r "ADK_WRAPPER_URL" .next/static/` and `grep -rn "run.app" .next/static/` → both empty.
7. Flip back `NEXT_PUBLIC_CHAT_MODE=mock`, restart → **G3:** app behaves exactly as today.

## Commit plan (one per concern, BIM-001-tagged)

1. `BIM-001: add /api/agent proxy route handlers + tests`
2. `BIM-001: chatService live mode behind NEXT_PUBLIC_CHAT_MODE + tests, SWAP_NOTES updated`
3. `BIM-001: env template + changelog`
4. `BIM-001: retrospective + session/recovery docs` (module close)

## Assumptions

1. Hosting target = local `npm run dev` only (per manager); `maxDuration` is defensive future-proofing, not a scope add.
2. `AppConfig.wrapperUrl` in `src/types/index.ts` is a pre-amendment artifact consumed nowhere I must touch — it stays as-is (types file is forbidden zone).
3. Tony supplies the real wrapper URL in-session for his manual pass; I never see it into a file that gets committed.

## Risks

- `AbortSignal.timeout` in the *browser* path of chatService requires a modern browser (baseline for this stack; Node 24 covers tests/SSR).
- Route tests import `next/server` (`NextResponse`) under Jest node env — same pattern as the existing `superadmin-add-user` route test, so proven in this repo.
