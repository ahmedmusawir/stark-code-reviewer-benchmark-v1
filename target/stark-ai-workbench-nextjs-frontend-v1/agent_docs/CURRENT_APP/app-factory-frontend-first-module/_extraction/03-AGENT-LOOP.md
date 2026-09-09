# 03 — Agent Loop (Request/Response Lifecycle)

**Repo:** google-adk-n8n-hybrid-streamlit-v2
**Extraction Date:** 2026-05-23
**Extracted By:** Claude Code
**Status:** FINAL
**Focus Lens:** SECONDARY

---

## Summary

This repo IS NOT an agent. It is a UI client. There is no plan/act/observe loop, no tool registry, no LLM inference inside this codebase. The "loop" here is the **request/response lifecycle** for two operations: (a) a chat message round-trip, and (b) a Mission Control save round-trip. Both are synchronous, blocking, single-shot. There is no streaming, no retry, no queue. The Streamlit script reruns from the top after each response.

---

## Findings

### Lifecycle 1 — Chat Message Round-Trip

**EVIDENCE — Triggered by `st.chat_input` submission (`chat.py:142`):**

#### Stage 1 — User submits

```
User types in st.chat_input → presses Enter
  ↓
chat.py:142  prompt := st.chat_input(f"Ask {selected_agent} a question...")
  ↓
chat.py:144  st.session_state.messages.append({"role": "user", "content": prompt})
chat.py:145-146  Echo to UI:  st.chat_message("user").markdown(prompt)
```

#### Stage 2 — Prepare payload

```
chat.py:149  current_session_id = st.session_state.agent_sessions.get(selected_agent)
             # None if first message to this agent for this user
```

#### Stage 3 — Block + spinner

```
chat.py:152  with st.spinner("Agent is thinking..."):
chat.py:153-158    response_data = call_agent_wrapper(
                       agent_name=selected_agent,
                       message=prompt,
                       user_id=user_id,
                       session_id=current_session_id
                   )
```

#### Stage 4 — HTTP call (`call_agent_wrapper` at `chat.py:60-85`)

```
chat.py:67-72  payload = {
                 "agent_name": agent_name,
                 "message": message,
                 "user_id": user_id,
                 "session_id": session_id
               }
chat.py:80     response = requests.post(
                 f"{WRAPPER_URL}/run_agent",
                 json=payload,
                 timeout=90
               )
chat.py:81     response.raise_for_status()
chat.py:82     return response.json()
```

**EVIDENCE — Timeout:** 90 seconds (`chat.py:80`).
**EVIDENCE — Method:** POST.
**EVIDENCE — Body shape:** see 04-TOOL-SYSTEM.md for the exact contract.

#### Stage 5 — Parse response

```
chat.py:160  assistant_response = response_data.get("response", "Error: No response content.")
chat.py:163  new_session_id = response_data.get("session_id")
```

**EVIDENCE — Only two fields are consumed from the wrapper response:** `response` (string) and `session_id` (string). Any other fields in the response are ignored.
**Source:** `chat.py:160, 163` — grep of `chat.py` for `response_data.` shows only these two keys.

#### Stage 6 — Persist session_id bookmark (conditional)

```
chat.py:164-166  if new_session_id and new_session_id != current_session_id:
                     st.session_state.agent_sessions[selected_agent] = new_session_id
                     save_profile(supabase, user_id, st.session_state.agent_sessions)
```

**EVIDENCE — `save_profile()` does a Supabase upsert (`utils/auth.py:28-36`):**
```
supabase.table("adk_n8n_hybrid_profiles").upsert({
    "id": user_id,
    "agent_sessions": agent_sessions
}).execute()
```

**INFERENCE — The save happens synchronously inside the chat loop**, after the HTTP response. So a single chat send produces 1 wrapper call + (conditionally) 1 Supabase upsert before the rerun.

#### Stage 7 — Append + rerun

```
chat.py:169  st.session_state.messages.append({"role": "assistant", "content": assistant_response})
chat.py:172  st.rerun()
```

**EVIDENCE — On rerun:**
- The login gate is bypassed (`session != None`)
- The agent-switch branch is skipped (`last_selected_agent == selected_agent`)
- The for-loop at `chat.py:137-139` renders ALL messages (including the just-appended assistant message)
- `st.chat_input` is rendered empty again, awaiting next user input

---

### Lifecycle 2 — History Fetch on Agent-Switch

**EVIDENCE — Triggered when the sidebar selectbox value changes (`chat.py:114-133`):**

```
User picks a different agent in the sidebar
  ↓
Streamlit re-runs the script with the new selectbox value
  ↓
chat.py:114  st.session_state.get("last_selected_agent") != selected_agent  → True
chat.py:115  st.session_state.last_selected_agent = selected_agent
chat.py:118  resumed_session_id = st.session_state.agent_sessions.get(selected_agent)
chat.py:121  history = fetch_history(selected_agent, user_id, resumed_session_id)
chat.py:130  st.session_state.messages = history
chat.py:133  st.rerun()
```

**EVIDENCE — `fetch_history()` (`chat.py:87-103`):**
```
chat.py:90-91  if not session_id or not WRAPPER_URL:
                   return []
chat.py:93-97  payload = {
                   "agent_name": agent_name,
                   "user_id": user_id,
                   "session_id": session_id,
               }
chat.py:98     response = requests.post(f"{WRAPPER_URL}/get_history", json=payload, timeout=30)
chat.py:99     response.raise_for_status()
chat.py:100    return response.json().get("history", [])
```

**EVIDENCE — Early return when no session_id**: a new user (never chatted with this agent before) does NOT cause an HTTP call.
**EVIDENCE — Timeout:** 30 seconds (`chat.py:98`).
**EVIDENCE — Method:** POST (not GET, despite being a read operation).

#### History response shape consumed

**EVIDENCE — Only the `history` key is consumed**, expected to be a list of `{role, content}` dicts. Any other top-level fields in the response are ignored.
**Source:** `chat.py:100`

---

### Lifecycle 3 — Mission Control Save Round-Trip

**EVIDENCE — Triggered by per-agent Save button (`pages/1_Mission_Control.py:33-37`):**

```
User edits the text area for agent X → clicks "Save for X"
  ↓
pages/1_Mission_Control.py:33  if st.button(f"Save for {agent}", key=f"{agent}_button"):
pages/1_Mission_Control.py:35    update_instructions(agent, new_instructions)
pages/1_Mission_Control.py:36    st.toast(f"✅ Success! Instructions for `{agent}` updated.", icon="✅")
```

**EVIDENCE — `update_instructions()` (`utils/gcs_utils.py:21-32`):**
```
storage_client = storage.Client()
bucket = storage_client.bucket("adk-agent-context-ninth-potion-455712-g9")
file_path = f"ADK_Agent_Bundle_1/{agent_name}/{agent_name}_instructions.txt"
blob = bucket.blob(file_path)
blob.upload_from_string(new_content, content_type='text/plain')
```

**EVIDENCE — Direct GCS write from the Streamlit process.** No HTTP call to the wrapper; no intermediate API; no version history; the blob is overwritten in place.

**EVIDENCE — On failure** (`pages/1_Mission_Control.py:37`):
- The exception is caught
- `st.error(f"Failed to update instructions for {agent}. Error: {e}")` is rendered

**EVIDENCE — On `fetch_instructions()` failure** (`utils/gcs_utils.py:7-19`), the exception is swallowed and a string is returned: `f"Error: Could not load instructions for {agent_name}."`. This string is then displayed inside the text area as if it were the agent's instructions.

---

### Sync vs Async

**EVIDENCE — Everything is synchronous:**

| Operation | Library | Sync? | Streaming? |
|---|---|---|---|
| `requests.post()` to wrapper | `requests` | Sync | No |
| `supabase.auth.sign_in_with_password()` | `supabase` (sync client) | Sync | No |
| `supabase.table().select()/.upsert()` | `supabase` (sync client) | Sync | No |
| `blob.download_as_text()` | `google-cloud-storage` (sync) | Sync | No |
| `blob.upload_from_string()` | `google-cloud-storage` (sync) | Sync | No |

**EVIDENCE — There is no `asyncio`, no `aiohttp`, no SSE client, no WebSocket usage in the first-party code.**
**Source:** grep of first-party `*.py` for `async`, `await`, `aiohttp`, `WebSocket`, `EventSource` returns no matches.

**INFERENCE — A user typing a message must wait the full agent latency (up to 90s) before seeing any response. The `st.spinner("Agent is thinking...")` is the only feedback during that wait.**

---

### Blocking-render Model

**EVIDENCE — Streamlit's execution model means every state change re-executes the script top-to-bottom:**
- `st.rerun()` triggers a full re-execution (used at `chat.py:33, 54, 133, 172`)
- Selectbox/button interactions trigger automatic reruns
- All state must survive in `st.session_state` (in-memory) or be re-fetched

**INFERENCE — There is no concept of "components that re-render in isolation."** This shapes how the Next.js port will need to redesign state ownership.

---

### Retry / Backoff Behavior

**EVIDENCE — None.** There is no retry, no exponential backoff, no circuit breaker. A failed wrapper call:
- `requests.exceptions.RequestException` is caught at `chat.py:83-85`
- `st.error(...)` is rendered
- A placeholder `{"response": f"Error: Could not reach Agent Wrapper. Details: {e}"}` is returned
- That error string ends up in `assistant_response` and is appended to `messages` (`chat.py:169`)

**INFERENCE — Failed assistant turns DO get appended to the message list and persist there in `st.session_state.messages`** until the next agent-switch (which replaces `messages` with `fetch_history(...)`). They do NOT persist to the wrapper / Postgres.

**Source:** `chat.py:83-85, 169`

---

### Timing Observations

| Call | Timeout | Behavior on timeout |
|---|---|---|
| POST `/run_agent` | 90 s (`chat.py:80`) | `requests.exceptions.Timeout` → caught → `st.error` + error placeholder |
| POST `/get_history` | 30 s (`chat.py:98`) | Caught → `st.error` + empty list returned |
| Supabase `sign_in_with_password` | Library default (no explicit override) | Caught at `chat.py:34-35` |
| Supabase `select`/`upsert` | Library default | Caught in `utils/auth.py:23-25, 35-36` |
| GCS `download_as_text` | Library default | Caught in `utils/gcs_utils.py:17-19` |
| GCS `upload_from_string` | Library default | Caught + re-raised (`utils/gcs_utils.py:32-33`) |

---

### Interrupt Handling

**GAP — No explicit interrupt/cancel mechanism.** A user cannot abort an in-flight `/run_agent` call. The `st.spinner` blocks the UI. If the user navigates to Mission Control via the sidebar mid-call:
- **INFERENCE:** Streamlit will queue the navigation until the script finishes. The current call must complete (or timeout) before navigation happens.

**Source:** absence of cancel logic in `chat.py:142-172`; INFERENCE based on Streamlit's documented execution model.

---

## Open Questions

1. Does the wrapper's `/run_agent` create a brand-new session_id on first call (when the client sends `session_id: null`), or does it require the client to generate one? **OBSERVED EVIDENCE:** `chat.py:163-165` only sets `agent_sessions[agent] = new_session_id` if the wrapper returned one different from `current_session_id`. So the wrapper IS the source of new session ids. The client never generates one. The DATA_CONTRACT in 04-TOOL-SYSTEM documents this faithfully.
2. Why is `/get_history` POST instead of GET? Out of scope to answer; documented as EVIDENCE.

---

## Verification Checklist

- [x] All findings labeled with evidence tags
- [x] All file references verified to exist
- [x] No invented function names or file paths
- [x] No synthesis or recommendations included
- [x] GAPs explicitly documented
