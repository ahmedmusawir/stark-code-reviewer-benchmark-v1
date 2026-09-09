# 02 — Architecture Map (FLOW MAP)

**Repo:** google-adk-n8n-hybrid-streamlit-v2
**Extraction Date:** 2026-05-23
**Extracted By:** Claude Code
**Status:** FINAL
**Focus Lens:** PRIMARY — repurposed as FLOW MAP per mission briefing

---

## Summary

This doc maps the end-to-end user journey, the data-and-state flow underneath it, and the boundary between what the frontend owns vs what lives externally. It answers: **where does each piece of state live, when is it fetched, when is it persisted, and what triggers each transition.** The frontend is a thin orchestrator: it owns ephemeral UI state in `st.session_state`, persists agent-session bookmarks to Supabase, fetches conversation history fresh from the wrapper on agent-switch, and writes instruction edits directly to Google Cloud Storage.

---

## Findings

### System Boundary Diagram

**EVIDENCE — Components touched by frontend code:**

```
┌─────────────────────────────────────────────────────────────┐
│                  STREAMLIT FRONTEND (this repo)             │
│                                                             │
│  chat.py                       pages/1_Mission_Control.py   │
│   ├── Login screen              ├── Page gatekeeper         │
│   ├── Chat screen               └── Per-agent textarea +    │
│   └── Sidebar (agent picker         Save button             │
│       + logout)                                             │
│                                                             │
│  Imports: config.py, utils/auth.py, utils/gcs_utils.py      │
│                                                             │
└──────────┬──────────────────────┬──────────────────┬───────┘
           │                      │                  │
           │ HTTP (requests)       │ Supabase SDK     │ google-cloud-storage SDK
           │                      │                  │
           ▼                      ▼                  ▼
   ┌──────────────┐       ┌──────────────┐    ┌──────────────┐
   │ ADK Wrapper  │       │   Supabase   │    │  GCS Bucket  │
   │ (FastAPI)    │       │              │    │              │
   │              │       │ auth.users   │    │ adk-agent-   │
   │ POST         │       │ table:       │    │ context-...  │
   │  /run_agent  │       │  adk_n8n_    │    │              │
   │ POST         │       │  hybrid_     │    │ blob:        │
   │  /get_history│       │  profiles    │    │  ADK_Agent_  │
   │              │       │              │    │  Bundle_1/   │
   │ → ADK + LLMs │       │              │    │  {agent}/    │
   │ → Postgres   │       │              │    │  {agent}_    │
   │   (memory)   │       │              │    │  instructions│
   │              │       │              │    │  .txt        │
   └──────────────┘       └──────────────┘    └──────────────┘
   (separate repo)         (external SaaS)    (Google Cloud Storage)
```

**Sources:**
- Wrapper HTTP: `chat.py:80, 98`
- Supabase: `chat.py:10-12, 27-29`; `utils/auth.py:14-36`
- GCS: `utils/gcs_utils.py:4-32`

---

### End-to-End User Journey

The complete happy-path journey, in execution order:

#### Step 1 — App load, unauthenticated

**EVIDENCE — Initial state:**
- Streamlit boots `chat.py`
- `config.py` loads `config.json`, resolves `WRAPPER_URL` based on `APP_ENV` (`config.py:11-27`)
- `chat.py:14-15` initializes `st.session_state.session = None` if absent
- `chat.py:18-35` renders the Login screen because `session is None`

**State at this moment:**
- `st.session_state.session` = `None`
- Everything else: not yet set

**Source:** `chat.py:14-35`

---

#### Step 2 — User submits login form

**EVIDENCE — On "Authenticate" button submit (`chat.py:25-35`):**

```
1. supabase.auth.sign_in_with_password({email, password})
2. On success:
   a. st.session_state.session = auth_response.session  (line 30)
   b. user_id = st.session_state.session.user.id        (line 31)
   c. st.session_state.agent_sessions = fetch_profile(supabase, user_id)  (line 32)
   d. st.rerun()                                         (line 33)
3. On exception:
   a. st.error(f"Authentication failed: {e}")            (line 35)
```

**`fetch_profile()` behavior (`utils/auth.py:14-25`):**
```
SELECT agent_sessions FROM adk_n8n_hybrid_profiles WHERE id = {user_id}
→ returns {} if no row, or row's agent_sessions dict
```

**Source:** `chat.py:25-35`, `utils/auth.py:14-25`

---

#### Step 3 — Authenticated landing (Chat screen first render)

**EVIDENCE — On rerun with `session ≠ None` (`chat.py:40-56`):**
- Branch enters the `else:` block
- `user_id = st.session_state.session.user.id` (line 41)
- State initializers run if keys missing (lines 44-49):
  - `agent_sessions = {}` (already set during login)
  - `messages = []`
  - `last_selected_agent = ""`
- Sidebar renders:
  - "Authenticated as: {email}" (line 51)
  - "Logout" button (line 52)
  - "Configuration" title (line 106)
  - "Choose an agent:" selectbox, options from `AGENT_OPTIONS` (line 107)
  - "Chatting with: **{selected_agent}**" info (line 108)
- Main page renders title "⚡ Cyberize Agentic Automation" (line 56)
- Empty chat area (no messages yet)
- Chat input "Ask {selected_agent} a question..." at bottom (line 142)

**Source:** `chat.py:40-56, 106-108, 142`

---

#### Step 4 — Selectbox default selection triggers history load

**EVIDENCE — `chat.py:114-133`:**
On the first render after login, `last_selected_agent` is `""` and `selected_agent` is the first item from `AGENT_OPTIONS` (i.e., `greeting_agent`, per `config.json:13-18`). They differ, so the branch fires:

```
1. st.session_state.last_selected_agent = selected_agent       (line 115)
2. resumed_session_id = agent_sessions.get(selected_agent)      (line 118)
   → None if user has never chatted with this agent before
3. history = fetch_history(selected_agent, user_id, resumed_session_id)  (line 121)
   → fetch_history early-returns [] if session_id is None (utils/auth-side, no, in chat.py:91-92)
4. st.session_state.messages = history                          (line 130)
5. st.rerun()                                                   (line 133)
```

**Source:** `chat.py:114-133`

**INFERENCE — A new user with no profile sees no API call to `/get_history` because `resumed_session_id` is `None` and `fetch_history` returns `[]` early at `chat.py:91-92`. Verified: yes, that early return prevents the call.**

---

#### Step 5 — User types a message and hits Enter

**EVIDENCE — `chat.py:142-172`:**
```
1. st.chat_input(...) returns the prompt string (walrus :=)
2. messages.append({"role": "user", "content": prompt})            (line 144)
3. st.chat_message("user").markdown(prompt) — immediate echo       (lines 145-146)
4. current_session_id = agent_sessions.get(selected_agent)         (line 149)
5. with st.spinner("Agent is thinking..."):                        (line 152)
     response_data = call_agent_wrapper(
         agent_name=selected_agent, message=prompt,
         user_id=user_id, session_id=current_session_id
     )
6. assistant_response = response_data.get("response", "Error: No response content.")  (line 160)
7. new_session_id = response_data.get("session_id")                (line 163)
8. If new_session_id and new_session_id != current_session_id:
     a. agent_sessions[selected_agent] = new_session_id            (line 165)
     b. save_profile(supabase, user_id, agent_sessions)            (line 166)
9. messages.append({"role": "assistant", "content": assistant_response})  (line 169)
10. st.rerun()                                                     (line 172)
```

**Source:** `chat.py:142-172`

---

#### Step 6 — User switches agent via sidebar dropdown

**EVIDENCE — `chat.py:114-133` (same branch as Step 4 but now with non-empty last_selected_agent):**
- Selectbox value changes → Streamlit reruns the script
- `last_selected_agent != selected_agent` → branch fires
- Fetches history for the new agent's bookmarked session_id
- Replaces `st.session_state.messages` with that history
- **EVIDENCE:** No save of the previous agent's messages happens at this point — history is read fresh from the wrapper on every switch. Local message state for the previous agent is discarded.

**Source:** `chat.py:114-133`

**EVIDENCE — Stale-session purge logic is commented out:**
```python
# if not history and resumed_session_id:
#     st.session_state.agent_sessions.pop(selected_agent, None)
#     print(f"Info: Cleared stale session ID for {selected_agent} from state.")
```
**Source:** `chat.py:125-127`. This means a stale session id (e.g., one the wrapper no longer recognizes) is NOT auto-cleared from the user's profile — the user keeps an empty conversation that re-creates the session on next message.

---

#### Step 7 — User navigates to Mission Control via sidebar

**EVIDENCE — Streamlit auto-discovers `pages/1_Mission_Control.py` and renders a sidebar link.** No code in `chat.py` references this navigation; it is purely Streamlit's multi-page convention.

**EVIDENCE — On entering the page (`pages/1_Mission_Control.py:6-10`):**
```
1. gatekeeper() — utils/auth.py:5-12
   → if no session in st.session_state, render warning + stop()
2. st.set_page_config(page_title="Mission Control", page_icon="🎛️")
3. st.title("🎛️ Mission Control")
4. st.markdown("Update agent instructions in real-time.")
```

**Source:** `pages/1_Mission_Control.py:6-10`, `utils/auth.py:5-12`

---

#### Step 8 — Mission Control renders per-agent editors

**EVIDENCE — `pages/1_Mission_Control.py:13-37`:**

```python
AGENT_NAMES = ["greeting_agent", "calc_agent", "jarvis_agent", "product_agent"]
# Note: hardcoded; differs from config.json's 5-agent list — missing ghl_mcp_agent

for agent in AGENT_NAMES:
    st.divider()
    st.subheader(f"Instructions for: `{agent}`")
    current_instructions = fetch_instructions(agent)       # GCS read
    new_instructions = st.text_area(
        label="Modify instructions:",
        value=current_instructions,
        height=250,
        key=f"{agent}_textarea"
    )
    if st.button(f"Save for {agent}", key=f"{agent}_button"):
        try:
            update_instructions(agent, new_instructions)   # GCS write
            st.toast(f"✅ Success! Instructions for `{agent}` updated.", icon="✅")
        except Exception as e:
            st.error(f"Failed to update instructions for {agent}. Error: {e}")
```

**Source:** `pages/1_Mission_Control.py:13-37`

**EVIDENCE — `fetch_instructions(agent)` reads on EVERY render:** there is no caching wrapper around the GCS call. Each Streamlit rerun pulls 4 blobs from GCS.
**Source:** `utils/gcs_utils.py:7-19`, called from `pages/1_Mission_Control.py:22`

---

#### Step 9 — Logout

**EVIDENCE — `chat.py:52-54`:**
```python
if st.sidebar.button("Logout"):
    st.session_state.session = None
    st.rerun()
```

**EVIDENCE — `agent_sessions`, `messages`, `last_selected_agent` are NOT cleared on logout.** Only `session` is cleared. On rerun, the Login screen renders because `session is None`. If the same user logs back in, `fetch_profile()` overwrites `agent_sessions` (`chat.py:32`) but `messages` and `last_selected_agent` from the previous session remain — until the agent-switch branch (`chat.py:114-133`) fires, which is on first render because `last_selected_agent != selected_agent`.

**INFERENCE — In practice, the stale `messages` are immediately replaced by the agent-switch branch on first re-render, so the leak is not user-visible. But it IS in memory between logout and the next form submit.**

**Source:** `chat.py:52-54, 114-133`

---

### State Flow — Where Does Each Piece Live?

| Data | Lives in | Lifetime | Set by | Read by |
|---|---|---|---|---|
| Supabase session token | `st.session_state.session` | Until logout / process restart | Login form submit (`chat.py:30`) | Every screen via `gatekeeper()` / `chat.py:18` |
| `user_id` (Supabase UUID) | Derived from `session.user.id` on every render | n/a (derived) | `chat.py:41` | Every wrapper call, every Supabase call |
| Authenticated user's email | `session.user.email` | Until logout | Supabase auth response | Sidebar display (`chat.py:51`) |
| `agent_sessions` (dict: `{agent_name: session_id}`) | `st.session_state.agent_sessions` AND Supabase `adk_n8n_hybrid_profiles.agent_sessions` jsonb column | Persisted across logins | Updated when wrapper returns new `session_id` (`chat.py:165`) | Agent-switch (`chat.py:118`), chat send (`chat.py:149`) |
| `messages` (list of `{role, content}`) | `st.session_state.messages` only — **NOT persisted** | Process-local; replaced on every agent-switch | Agent-switch (`chat.py:130`), chat send (`chat.py:144, 169`) | Render loop (`chat.py:137-139`) |
| `last_selected_agent` | `st.session_state.last_selected_agent` | Process-local | `chat.py:115` | Agent-switch guard (`chat.py:114`) |
| Per-agent conversation history | Wrapper-side (Postgres, per `docs/overview.md` mention) | Persistent; fetched fresh on agent-switch | Wrapper backend (out of scope) | `fetch_history` → `chat.py:130` |
| Agent instruction text | GCS blob | Persistent | Mission Control save (`utils/gcs_utils.py:21-32`) | Mission Control render (`utils/gcs_utils.py:7-19`); wrapper at runtime (out of scope) |
| Agent registry (chat) | `config.json:13-18` → `config.py:35` | Build-time | Static file | `chat.py:107` |
| Agent registry (Mission Control) | Hardcoded in `pages/1_Mission_Control.py:13` | Build-time | Static literal | Per-agent loop (`pages/1_Mission_Control.py:16`) |

---

### Streamlit `st.session_state` Keys — Complete Inventory

**EVIDENCE — All keys written to or read from `st.session_state` across the codebase:**

| Key | Type | Set where | Read where | Cleared where |
|---|---|---|---|---|
| `session` | `supabase.AuthResponse.session` or `None` | `chat.py:30, 53`; `chat.py:15` (init) | `chat.py:18, 41, 51`; `utils/auth.py:9` | `chat.py:53` (Logout) |
| `agent_sessions` | `dict[str, str]` (agent_name → session_id) | `chat.py:32, 45, 165` | `chat.py:118, 149, 166` | Never explicitly |
| `messages` | `list[dict]` ({"role", "content"}) | `chat.py:47, 130, 144, 169` | `chat.py:137` | Replaced on agent-switch |
| `last_selected_agent` | `str` | `chat.py:49, 115` | `chat.py:114` | Never explicitly |
| `{agent}_textarea` | `str` (Streamlit-managed widget state) | `pages/1_Mission_Control.py:30` (`key=`) | Returned by `st.text_area` | Page navigation away |
| `{agent}_button` | `bool` (Streamlit-managed widget state) | `pages/1_Mission_Control.py:33` (`key=`) | Returned by `st.button` | Page navigation away |

---

### Agent Registry — Where Does the Dropdown Get Its List?

**EVIDENCE — Chat screen (`chat.py:107`):**
```
config.json (line 13-18, "agents" array)
  ↓
config.py:35 — config_data.get("agents", [])
  ↓
AGENT_OPTIONS export
  ↓
chat.py:7 — from config import AGENT_OPTIONS
  ↓
chat.py:107 — st.sidebar.selectbox(..., options=AGENT_OPTIONS)
```

Current list: `["greeting_agent", "jarvis_agent", "calc_agent", "product_agent", "ghl_mcp_agent"]`

**EVIDENCE — Mission Control screen (`pages/1_Mission_Control.py:13`):**
- Hardcoded inline as `AGENT_NAMES`
- Does NOT import from `config`
- Current list: `["greeting_agent", "calc_agent", "jarvis_agent", "product_agent"]`
- **DRIFT:** missing `ghl_mcp_agent`; also a different ordering

**QUESTION — Forwarded to 10-RAW-FINDINGS.** Tagged as behavioral discrepancy per the APPROVED briefing.

---

### Cache / Fetch Strategy

**EVIDENCE — No explicit caching of any kind:**
- No `@st.cache_data`, `@st.cache_resource`, or `@st.cache` decorators anywhere in the codebase
- `fetch_instructions(agent)` is called for each of 4 agents on every Mission Control render → 4 GCS round-trips per render
- `fetch_history()` is called only on agent-switch, not on every render
- `call_agent_wrapper()` is called only on chat input submission

**Source:** grep of `@st.cache` across `*.py` returns no matches.

---

### Sync / Blocking Model

**EVIDENCE — All I/O is synchronous and blocking:**
- HTTP calls use `requests.post()` (blocking)
- Supabase calls use the sync client (`supabase.table(...).execute()`)
- GCS calls use the sync `google-cloud-storage` client
- The chat send shows `with st.spinner("Agent is thinking..."):` (`chat.py:152`) which blocks the script while awaiting the response
- After completion, `st.rerun()` re-executes the script top-to-bottom

**INFERENCE — No streaming of agent responses; the full text arrives in one HTTP response and is then rendered in full.**

---

### What Lives Outside This Repo (Boundary Crossings)

**EVIDENCE — Hard external dependencies:**

| External | Owned by | Frontend's contract |
|---|---|---|
| ADK Wrapper service | Separate repo, deployed at `https://adk-wrapper-prod-v2-952978338090.us-east1.run.app` | HTTP POST `/run_agent`, `/get_history` |
| Supabase project | External SaaS at `https://zldxzlbkoayhyhzxpjrq.supabase.co` | Auth + `adk_n8n_hybrid_profiles` table |
| GCS bucket | Google Cloud, project `ninth-potion-455712-g9` | Read/write blobs at `ADK_Agent_Bundle_1/{agent}/{agent}_instructions.txt` |
| Secret Manager | Google Cloud, project `ninth-potion-455712-g9` | Provides `SUPABASE_URL`, `SUPABASE_KEY` at deploy time |
| IAM Service Account | `stark-vertex-ai@ninth-potion-455712-g9.iam.gserviceaccount.com` | Provides GCS write access at runtime |

---

## Open Questions

1. **Stale-session handling is commented out.** Was this an intentional rollback, or unfinished work? Out of scope for extraction; flagged.
   **Source:** `chat.py:125-127`
2. **`messages` and `last_selected_agent` are not cleared on logout.** Acceptable in single-user-per-process Streamlit (process-local state), but worth noting for a Next.js port where global state lives in client memory shared across users only if same browser tab.
3. **Agent registry drift between chat and Mission Control** — see 10-RAW-FINDINGS.
4. **`ADK_BUNDLE_URL` is imported but unused.** Vestigial?
   **Source:** `chat.py:7`, no other reference in `chat.py`.

---

## Verification Checklist

- [x] All findings labeled with evidence tags
- [x] All file references verified to exist
- [x] No invented function names or file paths
- [x] No synthesis or recommendations included
- [x] GAPs explicitly documented
