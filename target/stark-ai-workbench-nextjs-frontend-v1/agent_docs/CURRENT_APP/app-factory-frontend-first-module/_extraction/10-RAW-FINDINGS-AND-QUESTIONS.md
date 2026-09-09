# 10 — Raw Findings and Questions

**Repo:** google-adk-n8n-hybrid-streamlit-v2
**Extraction Date:** 2026-05-23
**Extracted By:** Claude Code
**Status:** FINAL

---

## Summary

Catch-all for surprises, contradictions, and items deserving the architect's attention that don't fit cleanly into the other 10 docs. Includes the agent-list drift between Chat and Mission Control, dead-code references, the committed Supabase anon key (single-line neutral observation per APPROVED briefing), the direct-GCS write pattern from the frontend, and the pip-freeze bloat in `requirements.txt`.

---

## Findings

### F1. Agent registry drift between Chat and Mission Control

**EVIDENCE — Two different lists in two files:**

| Source | List | Count |
|---|---|---|
| `config.json:13-18` | `["greeting_agent", "jarvis_agent", "calc_agent", "product_agent", "ghl_mcp_agent"]` | 5 |
| `pages/1_Mission_Control.py:13` | `["greeting_agent", "calc_agent", "jarvis_agent", "product_agent"]` | 4 |

**EVIDENCE — Differences:**
- Mission Control hardcodes the list (does not import from `config`)
- Mission Control omits `ghl_mcp_agent`
- Ordering also differs (Mission Control has `calc_agent` before `jarvis_agent`)

**QUESTION — Tagged as behavioral discrepancy per APPROVED briefing.** Is `ghl_mcp_agent` intentionally excluded from instruction editing (e.g., because it uses MCP tools whose instructions live elsewhere), or is this a bug? **Stark to resolve before Next.js conversion.**

---

### F2. `chat-org.py` is dead code

**EVIDENCE — `chat-org.py` is the previous-architecture version of `chat.py`:**
- Calls n8n webhook directly at `http://127.0.0.1:5678/webhook/f11820f4-aaf0-4bb8-b536-b9097cc67877` (`chat-org.py:71`)
- Fetches history directly from ADK server at `http://127.0.0.1:8000/apps/{agent}/users/{user_id}/sessions/{session_id}` via GET (`chat-org.py:94`)
- Hardcodes agent list inline as 4 agents (`chat-org.py:113`) — same as Mission Control's list

**EVIDENCE — Not referenced by:**
- `Procfile:1` (uses `chat.py`)
- `start_chat.sh:3` (uses `chat.py`)
- `start_cloud.sh:9` (uses `chat.py`)
- Any `import` statement in any first-party Python file

**Per APPROVED briefing:** Excluded from SCREEN INVENTORY. Active entry is `chat.py` only. **Documented here as dead code awaiting cleanup decision (out of scope to remove during extraction).**

---

### F3. `Adk_N8N_Hybrid_v4.json` legacy artifact

**EVIDENCE — Exported n8n workflow:**
- 5 nodes: Webhook → Code Node 1 → HTTP Request (to `localhost:8080/run_agent`) → Code Node 2 → Respond to Webhook
- Webhook path: `f11820f4-aaf0-4bb8-b536-b9097cc67877`
- Maps the (legacy) frontend `{agent_name, message, userId, session_id}` shape to the wrapper's `{agent_name, message, user_id, session_id}` shape
- Repacks wrapper response into `{message, session_id}` and wraps it in `{data: <stringified JSON>}` — see Code Node 2

**EVIDENCE — Not active in current architecture.** `chat.py` calls the wrapper directly; n8n is bypassed.

**INFERENCE — Retained as historical reference.** The repo name `google-adk-n8n-hybrid-streamlit-v2` still carries "n8n" but the n8n hop is gone in v2.

---

### F4. `.streamlit/secrets.toml` is committed

**EVIDENCE — Per APPROVED briefing, neutral single-line observation:**

`.streamlit/secrets.toml` is committed to the repo and contains a Supabase URL and a Supabase anon key.

**Source:** `.streamlit/secrets.toml:3-4`

---

### F5. `ADK_BUNDLE_URL` is imported but never used

**EVIDENCE — `chat.py:7`:**
```python
from config import WRAPPER_URL, ADK_BUNDLE_URL, AGENT_OPTIONS
```

**EVIDENCE — Search for `ADK_BUNDLE_URL` in `chat.py`** returns only the import line. The variable is never referenced.

**EVIDENCE — `chat-org.py` uses an equivalent `ADK_SERVER_URL` constant for direct ADK calls (`chat-org.py:72, 94`)** — INFERENCE: `ADK_BUNDLE_URL` in `chat.py` is vestige from the same era, kept in the import but no longer wired into any call.

---

### F6. `WRAPPER_URL` env var is set in deploy but ignored by code

**EVIDENCE — `deploy.sh:21`:**
```bash
--set-env-vars="APP_ENV=cloud,WRAPPER_URL=${WRAPPER_URL}"
```

**EVIDENCE — `config.py` does NOT read `WRAPPER_URL` from env.** It reads `APP_ENV`, then looks up the URL inside `config.json`:
```python
# config.py:11
env = os.getenv("APP_ENV", "local").lower()
# config.py:14-17
with open('config.json', 'r') as f:
    config_data = json.load(f)
env_config = config_data.get("environments", {}).get(env)
```

**INFERENCE — `WRAPPER_URL` env var is set redundantly and never consumed.** The actual wrapper URL is the one in `config.json:8`.

**QUESTION — Was the intent to allow runtime override of the URL via env var, with `config.json` as fallback? If so, the code does not implement that.**

---

### F7. Mission Control save mechanism — direct GCS from frontend

**EVIDENCE — `pages/1_Mission_Control.py:33-37` + `utils/gcs_utils.py:21-32`:**

```
User clicks "Save for {agent}" → utils.gcs_utils.update_instructions(agent, text)
  → storage.Client().bucket("adk-agent-context-ninth-potion-455712-g9")
    .blob(f"ADK_Agent_Bundle_1/{agent}/{agent}_instructions.txt")
    .upload_from_string(text, content_type='text/plain')
```

**EVIDENCE — No HTTP call to the wrapper.** The Streamlit process (running as the GCP service account) writes the blob directly.

**Per APPROVED briefing — tagged as GAP + QUESTION:**

> "Next.js conversion will need to decide between (a) direct GCS write via service account, or (b) new wrapper endpoint. That decision is out of scope for extraction."

**Properties of the current write path:**
- Bucket: `adk-agent-context-ninth-potion-455712-g9`
- Path: `ADK_Agent_Bundle_1/{agent_name}/{agent_name}_instructions.txt`
- Content-Type: `text/plain`
- Encoding: UTF-8 (read side specifies `encoding='utf-8'`; write side does not specify but writes a Python string which `google-cloud-storage` encodes as UTF-8)
- Overwrites in place; no versioning logic in client code
- Auth: service account `stark-vertex-ai@ninth-potion-455712-g9.iam.gserviceaccount.com` with `roles/storage.objectAdmin` (`grant_streamlit_permissions.sh:13-15`)
- No per-user permission check beyond `gatekeeper()` (binary auth gate)

---

### F8. `requirements.txt` contains transitive bloat

**EVIDENCE — `requirements.txt` is 153 lines** and contains many packages not imported by any first-party file. Sampled examples:

| Package | Pinned version | Imported by frontend? |
|---|---|---|
| `google-adk` | 0.3.0 | No |
| `google-genai` | 1.28.0 | No |
| `litellm` | 1.66.3 | No |
| `openai` | 1.98.0 | No |
| `fastapi` | 0.116.1 | No |
| `uvicorn` | 0.35.0 | No |
| `mcp` | 1.12.2 | No |
| `yfinance` | 0.2.56 | No |
| `peewee` | 3.18.2 | No |
| `pytest`, `pytest-asyncio`, `pytest-mock` | 8.4.1 / 1.1.0 / 3.14.1 | No (no tests in repo) |
| `tiktoken` | 0.9.0 | No |

**INFERENCE — Pip-freeze from a shared environment.** Streamlit's actual runtime needs (per imports): `streamlit`, `requests`, `supabase`, `supabase_auth`, `supabase_functions`, `google-cloud-storage`, `google-auth`, plus their dependencies.

---

### F9. Debug `print` statements active on hot path

**EVIDENCE — `chat.py:75-77`:**
```python
print(f"🔍 STREAMLIT DEBUG:")
print(f"   URL: {WRAPPER_URL}/run_agent")
print(f"   Payload: {payload}")
```

These execute on **every chat message send**, logging the payload (including `user_id` and `session_id`) to server stdout.

---

### F10. Commented-out stale-session purge

**EVIDENCE — `chat.py:125-127`:**
```python
# if not history and resumed_session_id:
#     st.session_state.agent_sessions.pop(selected_agent, None)
#     print(f"Info: Cleared stale session ID for {selected_agent} from state.")
```

INFERENCE — Either:
- (a) Intentionally rolled back because the false-positive rate was high (e.g., a slow wrapper occasionally returns empty history), OR
- (b) Unfinished mid-refactor

Out of scope to determine which. Documented as a latent design decision.

---

### F11. `messages` and `last_selected_agent` not cleared on logout

**EVIDENCE — `chat.py:52-54` Logout handler:**
```python
if st.sidebar.button("Logout"):
    st.session_state.session = None
    st.rerun()
```

Only `session` is cleared. `agent_sessions`, `messages`, `last_selected_agent` remain in `st.session_state`.

INFERENCE — In Streamlit's single-tab process model this is harmless because (a) login re-hydrates `agent_sessions` and (b) `messages` is replaced on first agent-switch after re-login.

---

### F12. Auto-rendered sidebar nav exposes Mission Control link to unauthenticated users

**EVIDENCE — Streamlit's multi-page auto-discovery** renders sidebar links for both `chat.py` and `pages/1_Mission_Control.py` regardless of auth state. The unauthenticated user can click the Mission Control link and is then blocked by `gatekeeper()` on that page (`utils/auth.py:5-12`), which renders a warning instead of redirecting back to login.

**INFERENCE — Streamlit's stock behavior; not a code defect** in this repo. Documented as a UX detail to capture in the Next.js port (the rebuild may choose to hide nav links until authenticated).

---

### F13. No CLAUDE.md or AGENTS.md or other agent-config in this repo

**EVIDENCE — Search for `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `.windsurfrules`** at the repo root returns no matches.

The only CLAUDE.md in the tree is the extraction-skill doctrine at `_SKILLS/repo-extraction-skill/CLAUDE.md`, which is meta-tooling for THIS extraction operation, not the app's code.

---

### F14. README is a stub

**EVIDENCE — `README.md:1-2`:**
```
# google-adk-n8n-hybrid-streamlit-v2
ADK Frontend v2: This will be pushed to google cloud connecting to adk bundle & wrapper w/ cloud postgres db for long term memory
```

The README does not link to `docs/`, does not explain how to run the app, does not list the active screens, does not mention the deployed URL.

---

### F15. `chat.py` does NOT call `st.set_page_config`

**EVIDENCE — Source:** `chat.py:1-172` has no `st.set_page_config(...)` call.

**INFERENCE — The browser tab title for the chat page defaults to Streamlit's behavior** (script filename or "Streamlit"). The Mission Control page does set `page_title="Mission Control"` (`pages/1_Mission_Control.py:8`).

---

## Top 5 Discoveries (Worth The Architect's Attention)

1. **Agent registry drift** (F1) — `config.json` says 5 agents; Mission Control hardcodes 4. Decide canonical source before Next.js port.
2. **Direct-GCS write from frontend** (F7) — Mission Control bypasses the wrapper entirely. Next.js port decision pending.
3. **Vestigial `ADK_BUNDLE_URL` import and `WRAPPER_URL` env var** (F5, F6) — `chat.py` imports an unused constant, and `deploy.sh` sets an env var the code never reads. Resolve at port time.
4. **Commented-out stale-session purge** (F10) — A latent design call that the next architecture must consciously redo.
5. **Debug print statements active on hot path** (F9) — Will need to be cleaned during port or kept as structured logging.

---

## Critical GAPs

- **G1:** No tests of any kind (see `09-TESTS-AND-EVALS.md`).
- **G2:** No documentation of the wrapper API contract within this repo (see `01-EXISTING-DOCS-REVIEW.md`).
- **G3:** No client-side guard against saving an error-text-as-content in Mission Control (see `08-ERROR-HANDLING-AND-RECOVERY.md` F2).
- **G4:** No retry / backoff anywhere; one-shot failure surface.
- **G5:** Direct-GCS write from frontend has no audit trail (no versioning client-side, no who-changed-what record).

---

## Open Questions (Consolidated)

| # | Question | Source doc |
|---|---|---|
| Q1 | Is `ghl_mcp_agent`'s omission from Mission Control intentional? | F1 |
| Q2 | Should `chat-org.py` be deleted, or kept as historical reference? | F2 |
| Q3 | Should the Next.js Mission Control write via wrapper endpoint or direct-GCS? | F7 |
| Q4 | Was the commented-out stale-session purge an intentional rollback or unfinished work? | F10 |
| Q5 | Is `WRAPPER_URL` env var intended to be a runtime override (currently it isn't read)? | F6 |
| Q6 | Should logout call `supabase.auth.sign_out()` to invalidate the JWT server-side? | (see `08-`) |
| Q7 | Why is debug-print logging active in production? | F9 |
| Q8 | Should the failure path of `fetch_instructions` (`utils/gcs_utils.py:19`) raise instead of substituting an error string? | (see `08-` F2) |
| Q9 | Does Mission Control need a role gate beyond "is logged in"? | (see `07-`) |

---

## Verification Checklist

- [x] All findings labeled with evidence tags
- [x] All file references verified to exist
- [x] No invented function names or file paths
- [x] No synthesis or recommendations included
- [x] GAPs explicitly documented
