# 08 — Error Handling and Recovery

**Repo:** google-adk-n8n-hybrid-streamlit-v2
**Extraction Date:** 2026-05-23
**Extracted By:** Claude Code
**Status:** FINAL
**Focus Lens:** STANDARD

---

## Summary

The frontend uses a uniform pattern: every external call is wrapped in `try/except Exception`, the exception is shown to the user via `st.error(...)`, and a placeholder/sentinel value is returned to keep the UI rendering. There is no retry logic, no backoff, no circuit breaker, no exception class discrimination — every error is treated the same way. The error surface is broad (bare `Exception` catches) but consistent.

---

## Findings

### Error Handling Pattern — Inventory by Call Site

**EVIDENCE — All `try/except` blocks in first-party code:**

#### 1. Login (`chat.py:25-35`)

```python
try:
    auth_response = supabase.auth.sign_in_with_password({...})
    st.session_state.session = auth_response.session
    user_id = st.session_state.session.user.id
    st.session_state.agent_sessions = fetch_profile(supabase, user_id)
    st.rerun()
except Exception as e:
    st.error(f"Authentication failed: {e}")
```

- Catch: bare `Exception`
- Action: red callout
- Recovery: user stays on login screen; form is preserved (Streamlit retains input across reruns? — NOT in this case, since `st.form` clears on submit)

#### 2. Wrapper `/run_agent` call (`chat.py:79-85`)

```python
try:
    response = requests.post(f"{WRAPPER_URL}/run_agent", json=payload, timeout=90)
    response.raise_for_status()
    return response.json()
except Exception as e:
    st.error(f"Failed to connect to Agent Wrapper: {e}")
    return {"response": f"Error: Could not reach Agent Wrapper. Details: {e}"}
```

- Catch: bare `Exception` (covers `Timeout`, `ConnectionError`, `HTTPError`, `JSONDecodeError`)
- Action: red callout
- Recovery: returns sentinel `{"response": "Error: ..."}` (NO `session_id`)
- Downstream effect: the error string becomes the assistant's "message" and is appended to `messages` — visible in chat history until next agent-switch

#### 3. Defensive check before wrapper call (`chat.py:63-66`)

```python
if not WRAPPER_URL:
    st.error("Wrapper URL is not configured. Please check config.json.")
    return {"response": "Error: Frontend is not configured."}
```

- Defensive guard (not a try/except)
- In practice never triggers — `WRAPPER_URL` is always set at module load
- Recovery: returns sentinel with literal error text

#### 4. Wrapper `/get_history` call (`chat.py:90-103`)

```python
if not session_id or not WRAPPER_URL:
    return []
try:
    payload = {...}
    response = requests.post(f"{WRAPPER_URL}/get_history", json=payload, timeout=30)
    response.raise_for_status()
    return response.json().get("history", [])
except Exception as e:
    st.error(f"Failed to fetch history via wrapper: {e}")
    return []
```

- Catch: bare `Exception`
- Action: red callout
- Recovery: returns `[]` (empty conversation) — UI shows a clean slate

#### 5. Supabase profile fetch (`utils/auth.py:14-25`)

```python
try:
    response = supabase.table("adk_n8n_hybrid_profiles").select("agent_sessions").eq("id", user_id).execute()
    if response.data:
        return response.data[0].get("agent_sessions", {})
    return {}
except Exception as e:
    st.error(f"Error fetching profile: {e}")
    return {}
```

- Catch: bare `Exception`
- Action: red callout
- Recovery: returns `{}` — user proceeds with no bookmarked sessions; conversation starts fresh

#### 6. Supabase profile save (`utils/auth.py:28-36`)

```python
try:
    supabase.table("adk_n8n_hybrid_profiles").upsert({...}).execute()
except Exception as e:
    st.error(f"Error saving profile: {e}")
```

- Catch: bare `Exception`
- Action: red callout
- Recovery: silent — in-memory `agent_sessions` now diverges from Supabase

#### 7. GCS instruction fetch (`utils/gcs_utils.py:7-19`)

```python
try:
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
    file_path = f"{BASE_FOLDER}/{agent_name}/{agent_name}_instructions.txt"
    blob = bucket.blob(file_path)
    instructions = blob.download_as_text(encoding='utf-8')
    return instructions
except Exception as e:
    print(f"ERROR fetching instructions for '{agent_name}': {e}")
    return f"Error: Could not load instructions for {agent_name}."
```

- Catch: bare `Exception`
- Action: server-side `print` (NOT user-facing `st.error`)
- Recovery: returns the literal error string, which gets shown as the text area's initial content. **The user has no visual indicator that the read failed** beyond the error-message text appearing in the editor.

#### 8. GCS instruction write (`utils/gcs_utils.py:21-33`)

```python
try:
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
    file_path = f"{BASE_FOLDER}/{agent_name}/{agent_name}_instructions.txt"
    blob = bucket.blob(file_path)
    blob.upload_from_string(new_content, content_type='text/plain')
    print(f"Successfully updated instructions for '{agent_name}' in GCS.")
except Exception as e:
    print(f"ERROR updating instructions for '{agent_name}': {e}")
    raise
```

- Catch: bare `Exception`
- Action: server-side `print`, then **re-raise**
- Recovery: propagates to caller (`pages/1_Mission_Control.py:34-37`) which handles via `st.error`

#### 9. Mission Control save handler (`pages/1_Mission_Control.py:33-37`)

```python
if st.button(f"Save for {agent}", key=f"{agent}_button"):
    try:
        update_instructions(agent, new_instructions)
        st.toast(f"✅ Success! Instructions for `{agent}` updated.", icon="✅")
    except Exception as e:
        st.error(f"Failed to update instructions for {agent}. Error: {e}")
```

- Catch: bare `Exception`
- Action: red callout (NOT a toast — the success path uses toast, the failure path uses error callout, by design)
- Recovery: text area retains the unsaved edits (Streamlit's widget state); user can retry

---

### Retry / Backoff

**GAP — No retry logic anywhere.** Every call is one-shot. No exponential backoff, no `tenacity` decorators (despite `tenacity==8.5.0` being a transitive dep — unused by frontend code), no manual loop.
**Source:** grep for `retry`, `tenacity`, `backoff` returns no first-party hits.

---

### Timeout Handling

**EVIDENCE — Explicit timeouts:**

| Call | Timeout | Source |
|---|---|---|
| `POST /run_agent` | 90 s | `chat.py:80` |
| `POST /get_history` | 30 s | `chat.py:98` |
| All Supabase calls | Library default | (no override visible) |
| All GCS calls | Library default | (no override visible) |

**EVIDENCE — Timeouts raise** `requests.exceptions.Timeout`, which is caught by the bare `Exception` handler.

---

### Sentinel / Fallback Values

**EVIDENCE — Complete inventory:**

| Site | Sentinel | Effect on UI |
|---|---|---|
| `chat.py:65` | `{"response": "Error: Frontend is not configured."}` | Error text shown as assistant bubble |
| `chat.py:85` | `{"response": f"Error: Could not reach Agent Wrapper. Details: {e}"}` | Error text shown as assistant bubble |
| `chat.py:91` | `[]` | Empty conversation history |
| `chat.py:103` | `[]` | Empty conversation history |
| `chat.py:160` | `"Error: No response content."` (default for `.get("response", ...)`) | Shown as assistant bubble |
| `utils/auth.py:22` | `{}` | New-user agent_sessions |
| `utils/auth.py:25` | `{}` | Treated as if no bookmarks |
| `utils/gcs_utils.py:19` | `f"Error: Could not load instructions for {agent_name}."` | Shown in text area |

---

### Server-Side Logging (`print` statements)

**EVIDENCE — All `print` calls in first-party code:**

| Site | Message | Trigger |
|---|---|---|
| `config.py:38-39` | `f"✅ Config loaded for [ {APP_ENV} ] mode."` + URL | Module load |
| `chat.py:61` | `f"[STREAMLIT CALL WRAPPER] AGENT: {agent_name}, USER: {user_id}, SESSION: {session_id}"` | Every chat send |
| `chat.py:75-77` | `"🔍 STREAMLIT DEBUG:"` + URL + payload | Every chat send |
| `chat.py:88` | `f"[STREAMLIT FETCH HISTORY -> WRAPPER] AGENT: {agent_name}, USER: {user_id}, SESSION: {session_id}"` | Every history fetch |
| `chat.py:127` (commented out) | `f"Info: Cleared stale session ID for {selected_agent} from state."` | DEAD — code commented |
| `utils/gcs_utils.py:18` | `f"ERROR fetching instructions for '{agent_name}': {e}"` | GCS read failure |
| `utils/gcs_utils.py:30` | `f"Successfully updated instructions for '{agent_name}' in GCS."` | GCS write success |
| `utils/gcs_utils.py:32` | `f"ERROR updating instructions for '{agent_name}': {e}"` | GCS write failure |

**INFERENCE — `print` lines are visible in `gcloud run logs read` output and the local terminal.** Not visible to the user.

**EVIDENCE — Debug-style logging is uncommented (the `🔍 STREAMLIT DEBUG` block at `chat.py:75-77`) — it logs payload contents on every call.** This is on the chat path in production.

---

### Interrupt / Cancel

**GAP — No mechanism for the user to cancel an in-flight request.** The `st.spinner` blocks the UI; the user must wait for the request to complete or timeout.

---

### Graceful Degradation

**EVIDENCE — All errors degrade to "show error message + empty state":**
- Login failure → stays on login screen
- Profile fetch failure → empty bookmarks (chat works, but session resumption is lost)
- History fetch failure → empty conversation (user can still send messages)
- Wrapper send failure → error appears as assistant bubble; chat input remains usable
- GCS read failure → editor shows error text as content; user can still type and save (which would then overwrite the actual blob with edited error text — **EVIDENCE QUESTION**, see below)
- GCS write failure → red error callout; edits retained in text area for retry

---

### Notable Failure Modes Worth Flagging

#### F1. Stale `session_id` (commented-out logic)

**EVIDENCE — `chat.py:125-127`:** The code to purge stale session ids exists but is commented out. The condition for purging: `if not history and resumed_session_id` (i.e., wrapper returned empty history but client had a bookmarked id).

**Effect with the logic disabled:** A stale session id is kept in `agent_sessions`; the next chat send uses it. The wrapper's behavior with an unknown id is out of scope.

#### F2. GCS read returning error text as content

**EVIDENCE — `utils/gcs_utils.py:19` returns `f"Error: Could not load instructions for {agent_name}."` on failure.** This string then becomes the `value` of the text area at `pages/1_Mission_Control.py:27`.

**Hazard:** If the user does not notice the error text and clicks "Save", `update_instructions` would write that error string AS THE NEW INSTRUCTIONS to GCS. **GAP** — no client-side guard against saving an error-string-as-content.

**EVIDENCE QUESTION — Per APPROVED briefing, not "fixing", just documenting.**

#### F3. Logout does not invalidate the Supabase session server-side

**EVIDENCE — `chat.py:53` only sets `st.session_state.session = None`.** There is no call to `supabase.auth.sign_out()`. The JWT remains valid until natural expiry.

**INFERENCE — A copied JWT would remain usable.** Out of scope for assessment; documented as observation.

#### F4. No handling of expired Supabase JWT during a session

**EVIDENCE — None.** If a long-lived session encounters an expired JWT mid-session, the next Supabase call would fail and `st.error` would render. There is no automatic re-auth or token refresh trigger in this code (the SDK may handle silent refresh internally for `supabase==2.18.1`).

---

## Open Questions

1. Is the **commented-out stale-session purge** at `chat.py:125-127` intentionally disabled or unfinished work?
2. Should `fetch_instructions` failure show an `st.error` or `st.warning` instead of silently substituting the error string as content?
3. Should logout call `supabase.auth.sign_out()` to invalidate the JWT server-side?
4. Why is the debug `print` block at `chat.py:75-77` kept active in production?

---

## Verification Checklist

- [x] All findings labeled with evidence tags
- [x] All file references verified to exist
- [x] No invented function names or file paths
- [x] No synthesis or recommendations included
- [x] GAPs explicitly documented
