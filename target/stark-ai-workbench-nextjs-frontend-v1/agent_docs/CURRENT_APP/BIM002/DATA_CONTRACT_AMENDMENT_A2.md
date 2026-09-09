# BIM-002 — DATA_CONTRACT AMENDMENT A2 — FINAL
## The Native Connector Contract (Wrapper Retired, Seam Unchanged)

> Status: **FINAL — stamped 2026-07-18** · Supersedes Amendment A1's *route-internals* description ONLY. Everything at or above the route-handler boundary — chatService behavior, D1(b) sentinel, falsy-session guard, snake_case wire, mode flag — is **inherited unchanged from A1** and restated here only where load-bearing.

---

## A2.1 — The seam after the port

```
BEFORE (A1 / BIM-001):  chatService ─▶ /api/agent/* ─▶ Python Wrapper ─▶ ADK Bundle
AFTER  (A2 / BIM-002):  chatService ─▶ /api/agent/* ────────────────▶ ADK Bundle
                                        └── same external contract; only the box's insides changed
```

The route handlers' **external contracts are FROZEN and identical to A1**:
- `POST /api/agent/run` accepts `RunAgentRequest` → returns `{ response: string, session_id: string }`
- `POST /api/agent/history` accepts `GetHistoryRequest` → returns `{ history: Message[] }`
- Errors: 500 `{error}` config fault · 502 `{error}` upstream/parse fault · optional `Authorization` passed through (reserved slot, R2)

## A2.2 — Internal protocol (native ADK api_server)

| Op | Call |
|---|---|
| Create session | `POST {ADK_BUNDLE_URL}/apps/{agent_name}/users/{user_id}/sessions/{session_id}` — empty JSON body |
| Run | `POST {ADK_BUNDLE_URL}/run` — body `{ app_name, user_id, session_id, new_message: { role: "user", parts: [{ text }] } }` → event array |
| History | `GET {ADK_BUNDLE_URL}/apps/{agent_name}/users/{user_id}/sessions/{session_id}` → session object w/ events |

**N1 rule:** these paths are the Architect's port target from wrapper evidence; the Engineer verifies against disk before building — disk wins, deviations get ruled at plan review.

## A2.3 — Connector behaviors (the ported jewels)

1. **Session bootstrap:** request `session_id` null/empty → generate `session-${Date.now()}` (R4) → create → run. The generated id returns to the service in `session_id` (the frontend adopts it — existing behavior).
2. **Retry-once:** run failure bearing the session-not-found signature → create the session → retry run **exactly once**. Any second failure → 502. No other retries anywhere (wrapper parity).
3. **Response selection:** reversed scan of the event array; first event authored `model` containing a text part → that text is `response`. No qualifying event → 502 `{error: "No model response in events"}` (wrapper-equivalent failure).
4. **History normalization:** session events → `Message[]`: author `model` → `role: "assistant"`, author user → `role: "user"`; text parts only; non-text/system events skipped. Order preserved oldest→newest (what the UI renders today).
5. **Budgets:** run path 90s TOTAL (create + run + retry inclusive — plan states the split); history 30s. `maxDuration = 90` stays on the run route.

## A2.4 — Environment migration (R1)

| Var | Status |
|---|---|
| `ADK_BUNDLE_URL` | **NEW** — server-only, ADK api_server base. `.env.example`: `https://<bundle-service>-<project-number>.<region>.run.app` (structural placeholder ONLY — AM-2 doctrine) |
| `ADK_WRAPPER_URL` | **RETIRED** — removed from code and `.env.example` in this module |
| `NEXT_PUBLIC_CHAT_MODE` | Unchanged (mock fail-safe) |

Real values: `.env.local` only, Coordinator-managed, never committed.

## A2.5 — What A1 said would happen here (receipt)

A1 §A1.6 promised: "The route handler **signatures above do not change** in Phase B. That is the whole point of Phase A." This amendment is that promise, kept. chatService's BACKEND_SWAP_NOTES require **no edits** — the seam it documents is untouched; only a one-line note that the upstream is now native ADK may be added to the routes' own header comments.

**Version A2 1.0-FINAL** · 2026-07-18 · applies atop A1 (BIM001 folder) — A1 remains historical record.
