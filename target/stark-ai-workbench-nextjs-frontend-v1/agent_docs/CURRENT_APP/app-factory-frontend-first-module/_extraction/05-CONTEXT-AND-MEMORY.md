# 05 — Context and Memory

**Repo:** google-adk-n8n-hybrid-streamlit-v2
**Extraction Date:** 2026-05-23
**Extracted By:** Claude Code
**Status:** FINAL
**Focus Lens:** STANDARD-LEAN

---

## Summary

This frontend owns NO conversational memory, NO token budget, NO retrieval pipeline. All long-term memory lives in the wrapper backend (which talks to Postgres per the docs and the README). The frontend's "context and memory" surface is thin: a small set of `st.session_state` keys (process-local), one Supabase row per user that bookmarks session ids per agent, and a stateless GCS read pattern for instruction text. There is no caching layer of any kind in the first-party code.

---

## Findings

### What The Frontend Owns

**EVIDENCE — Three storage tiers used by the frontend:**

| Tier | Mechanism | Lifetime | What it holds |
|---|---|---|---|
| In-memory (process-local) | `st.session_state` | Until process restart or logout | Auth session, ephemeral UI flags, in-flight message list |
| Persistent per-user | Supabase row in `adk_n8n_hybrid_profiles` | Permanent | Map of `{agent_name: session_id}` — "bookmarks" so users can resume conversations |
| Persistent shared | GCS blobs | Permanent | Agent instruction text (one blob per agent) |

---

### `st.session_state` — Full Inventory

**EVIDENCE — Every key written or read across the codebase:**

#### Keys set by `chat.py`

| Key | Initial value | Set by | Read by |
|---|---|---|---|
| `session` | `None` (`chat.py:15`) | Login success (`chat.py:30`), Logout (`chat.py:53` sets to None) | Login gate (`chat.py:18`); page gatekeeper (`utils/auth.py:9`); user_id/email access (`chat.py:41, 51`) |
| `agent_sessions` | `{}` (`chat.py:45`) or hydrated from Supabase (`chat.py:32`) | Login (`chat.py:32`), new-session detected (`chat.py:165`) | Agent-switch (`chat.py:118`), chat send (`chat.py:149`), save_profile arg (`chat.py:166`) |
| `messages` | `[]` (`chat.py:47`) | Agent-switch (`chat.py:130`), chat send (`chat.py:144, 169`) | Render loop (`chat.py:137`) |
| `last_selected_agent` | `""` (`chat.py:49`) | Agent-switch (`chat.py:115`) | Agent-switch guard (`chat.py:114`) |

#### Keys auto-managed by Streamlit widgets (in `pages/1_Mission_Control.py`)

| Key | Source | Purpose |
|---|---|---|
| `{agent}_textarea` | `st.text_area(..., key=f"{agent}_textarea")` at `pages/1_Mission_Control.py:30` | Holds current text-area value across reruns |
| `{agent}_button` | `st.button(..., key=f"{agent}_button")` at `pages/1_Mission_Control.py:33` | One-shot click state |

**EVIDENCE — The four agents in Mission Control's hardcoded list (`greeting_agent`, `calc_agent`, `jarvis_agent`, `product_agent`) each produce two keys → 8 widget keys total per page render.**

---

### Persistent Memory — Supabase `adk_n8n_hybrid_profiles`

**EVIDENCE — Schema in use (inferred from `utils/auth.py:14-36`):**

```
Table: adk_n8n_hybrid_profiles
Columns referenced:
  - id            (UUID; conflict key for upsert; eq filter for select)
  - agent_sessions (jsonb; shape: {<agent_name>: <session_id>})
```

**EVIDENCE — Read pattern:** On every successful login (`chat.py:32`), the user's `agent_sessions` is hydrated into `st.session_state.agent_sessions`. Not re-fetched during the session.

**EVIDENCE — Write pattern:** Upsert fires ONLY when the wrapper returns a new session_id different from what the client sent (`chat.py:164-166`). Full-dict overwrite (not merge). In practice this is once per agent per user — on the first message ever sent to that agent.

**EVIDENCE — `agent_sessions` is never explicitly cleared.** No "clear conversation" UI exists. The dict only grows (per agent the user has chatted with).

---

### Per-Conversation History

**EVIDENCE — The frontend does NOT persist or accumulate conversation history.** History is:
- Held in `st.session_state.messages` only while the user is actively chatting
- Replaced wholesale by `fetch_history(...)` (`chat.py:121, 130`) when the user switches agents
- NOT saved back to anywhere by the frontend — the wrapper handles all conversation persistence

**INFERENCE — The wrapper is the source of truth for conversation history.** The frontend treats history as a read-only mirror of wrapper state.

**Source:** `chat.py:121, 130`; absence of any `messages → wrapper/db` write call.

---

### Token Budget Management

**GAP — There is none in the frontend.**

**EVIDENCE — No token counting, no truncation, no context window management** in any first-party Python file.
**Source:** grep across `*.py` for `tiktoken`, `token`, `budget`, `truncate`, `count_tokens` returns no first-party hits. `tiktoken==0.9.0` is in `requirements.txt:135` but unused by frontend code.

**INFERENCE — All token/context management lives in the wrapper or ADK.**

---

### Caching

**GAP — No caching in the frontend.**

**EVIDENCE — No `@st.cache_data`, `@st.cache_resource`, or `@st.cache` decorators anywhere.**
**Source:** grep across `*.py` for `@st.cache` returns no matches.

**EVIDENCE — Consequence:**
- `fetch_instructions(agent)` is called fresh on every Mission Control rerender (4 GCS GETs per render)
- `storage.Client()` is instantiated fresh on every call (`utils/gcs_utils.py:9, 24`)
- Supabase client `supabase` is created once at module load (`chat.py:12`), which is preserved across reruns because it's at module scope — this is the closest thing to a cache

---

### Retrieval / RAG

**GAP — None in the frontend.**

**EVIDENCE — No vector store, embedding, semantic search, or RAG-related code in first-party files.**
**Source:** absence in `chat.py`, `pages/1_Mission_Control.py`, `utils/*.py`.

**INFERENCE — Any retrieval (if it exists) lives in the wrapper or ADK agents.**

---

### Agent Instructions (Quasi-Static Context)

**EVIDENCE — Instructions are static text per agent, stored in GCS:**
- Location: `gs://adk-agent-context-ninth-potion-455712-g9/ADK_Agent_Bundle_1/{agent}/{agent}_instructions.txt`
- Format: plain UTF-8 text
- Mutated via the Mission Control UI (`pages/1_Mission_Control.py:33-37`)
- Consumed at runtime by the wrapper/ADK (out of scope — this repo never *reads* instructions during a chat call)

**INFERENCE — The Mission Control page exists to let an operator edit the agent's effective "system prompt" without redeploying the agent.** The wrapper presumably re-reads the blob on each request or watches for changes.

---

### Session Resumption Behavior

**EVIDENCE — On Login (`chat.py:32`):**
1. Frontend fetches `agent_sessions` dict from Supabase

**EVIDENCE — On agent-switch (`chat.py:114-133`):**
1. Look up `agent_sessions[selected_agent]` → may be `None` or a `session_id`
2. If `session_id` exists → call `/get_history` to populate `messages`
3. If `session_id` is `None` → skip the call (early return at `chat.py:91-92`), start fresh

**EVIDENCE — On chat send with no current session (`chat.py:149`):**
1. `session_id = None` sent to wrapper
2. Wrapper presumably creates a new session and returns its id in `response.session_id`
3. Frontend bookmarks the new id (`chat.py:165`) and saves to Supabase (`chat.py:166`)

**EVIDENCE — On chat send with existing session:**
1. Existing `session_id` sent
2. Wrapper returns the SAME `session_id` (or a new one — checked at `chat.py:164`)
3. Bookmark NOT updated if same id

**EVIDENCE — Stale session detection:** The would-be detection logic exists but is commented out at `chat.py:125-127`:
```python
# if not history and resumed_session_id:
#     st.session_state.agent_sessions.pop(selected_agent, None)
#     print(f"Info: Cleared stale session ID for {selected_agent} from state.")
```
**INFERENCE — A wrapper-side session expiry or restart leaves the user with a stale bookmark.** The next chat send will use the stale id; behavior depends entirely on how the wrapper handles unknown ids.

---

### Conversation Window Size

**GAP — No limit visible in the frontend.** The `messages` list grows unboundedly per session (until agent-switch replaces it).

**EVIDENCE — Render performance is the only implicit constraint:** `chat.py:137-139` iterates the full list on every rerun.

---

## Open Questions

1. Does the wrapper place a limit on how many history messages it returns via `/get_history`? Cannot be answered from this repo.
2. Are GCS instruction blobs re-read by the wrapper on every chat request, or cached server-side? Out of scope.
3. The `tiktoken==0.9.0` pinned dependency hints at token-counting somewhere — almost certainly in the wrapper, not here. Flagged as a transitive-dep observation in `00-REPO-PROFILE.md`.

---

## Verification Checklist

- [x] All findings labeled with evidence tags
- [x] All file references verified to exist
- [x] No invented function names or file paths
- [x] No synthesis or recommendations included
- [x] GAPs explicitly documented
