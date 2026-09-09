# 04 — Tool System (API SURFACE)

**Repo:** google-adk-n8n-hybrid-streamlit-v2
**Extraction Date:** 2026-05-23
**Extracted By:** Claude Code
**Status:** FINAL
**Focus Lens:** PRIMARY — repurposed as API SURFACE per mission briefing

---

## Summary

This doc is the **data contract** that the Next.js port's mocked service layer must mirror exactly. It enumerates every outbound call the Streamlit code makes — to the FastAPI wrapper, to Supabase, and to Google Cloud Storage — with exact endpoint paths, methods, request shapes, response shapes (as **consumed by the Streamlit code**), and error handling. Per the APPROVED briefing, response shapes are limited strictly to fields the Streamlit code reads; no speculation about additional wrapper fields.

**Total external call sites: 7** (2 wrapper HTTP, 3 Supabase, 2 GCS).

---

## Findings

### Inventory of External Calls

**EVIDENCE — Complete list:**

| # | Surface | Operation | Call site |
|---|---|---|---|
| 1 | Wrapper HTTP | POST `/run_agent` | `chat.py:80` |
| 2 | Wrapper HTTP | POST `/get_history` | `chat.py:98` |
| 3 | Supabase Auth | `sign_in_with_password` | `chat.py:27-29` |
| 4 | Supabase Table | `select` on `adk_n8n_hybrid_profiles` | `utils/auth.py:17` |
| 5 | Supabase Table | `upsert` on `adk_n8n_hybrid_profiles` | `utils/auth.py:31-34` |
| 6 | GCS | `blob.download_as_text` | `utils/gcs_utils.py:15` |
| 7 | GCS | `blob.upload_from_string` | `utils/gcs_utils.py:29` |

---

## A. Wrapper HTTP API

**Base URL:** resolved at boot from `config.json` via `APP_ENV`:
- Local: `http://localhost:8080` (`config.json:4`)
- Cloud: `https://adk-wrapper-prod-v2-952978338090.us-east1.run.app` (`config.json:8`)

**Source:** `config.py:11-27`, `chat.py:7`

---

### A1. `POST /run_agent`

**EVIDENCE — Call site:** `chat.py:60-85` (`call_agent_wrapper`), invoked at `chat.py:152-158`.

#### Request

**Method:** `POST`
**URL:** `{WRAPPER_URL}/run_agent`
**Content-Type:** `application/json` (implicit, from `requests.post(..., json=payload)`)
**Timeout:** 90 seconds

**Body — exact shape sent (`chat.py:67-72`):**
```json
{
  "agent_name": "<string>",
  "message": "<string>",
  "user_id": "<string>",
  "session_id": "<string or null>"
}
```

| Field | Type | Required? | Notes |
|---|---|---|---|
| `agent_name` | string | Required | One of `AGENT_OPTIONS` from `config.json`. Examples: `"greeting_agent"`, `"jarvis_agent"`, `"calc_agent"`, `"product_agent"`, `"ghl_mcp_agent"` |
| `message` | string | Required | Raw user input from `st.chat_input` |
| `user_id` | string | Required | Supabase user UUID (`auth.users.id`), via `session.user.id` |
| `session_id` | string or `null` | Conditionally required | `None` on first-ever message to this agent for this user; thereafter the wrapper-issued id |

**EVIDENCE — `session_id` may be `None`:** at `chat.py:149`, `current_session_id = agent_sessions.get(selected_agent)` returns `None` if the key is missing. The dict is passed to `requests.post(..., json=...)` which serializes `None` as JSON `null`. The wrapper is expected to accept this.

#### Response (as consumed by Streamlit)

**EVIDENCE — Only two fields are read from the response body:**

```json
{
  "response": "<string>",
  "session_id": "<string>"
}
```

| Field | Type | Read at | Behavior if missing |
|---|---|---|---|
| `response` | string | `chat.py:160` via `.get("response", "Error: No response content.")` | Falls back to literal string `"Error: No response content."` |
| `session_id` | string | `chat.py:163` via `.get("session_id")` | Falls back to `None` → bookmark NOT updated |

**EVIDENCE — Per the APPROVED briefing, no additional fields are documented.** Any other fields in the wrapper response are ignored by the Streamlit code.

#### Error handling

**EVIDENCE — `chat.py:79-85`:**
- `response.raise_for_status()` raises on 4xx/5xx
- All exceptions caught with bare `except Exception`
- On error:
  - `st.error(f"Failed to connect to Agent Wrapper: {e}")` rendered
  - Returns sentinel `{"response": f"Error: Could not reach Agent Wrapper. Details: {e}"}` — note: NO `session_id` in this sentinel
- The error string ends up appended as the assistant's message in the chat history (in-memory only)

---

### A2. `POST /get_history`

**EVIDENCE — Call site:** `chat.py:87-103` (`fetch_history`), invoked at `chat.py:121`.

#### Request

**Method:** `POST`
**URL:** `{WRAPPER_URL}/get_history`
**Content-Type:** `application/json`
**Timeout:** 30 seconds

**Body — exact shape sent (`chat.py:93-97`):**
```json
{
  "agent_name": "<string>",
  "user_id": "<string>",
  "session_id": "<string>"
}
```

| Field | Type | Required? | Notes |
|---|---|---|---|
| `agent_name` | string | Required | Same value set as `/run_agent` |
| `user_id` | string | Required | Supabase user UUID |
| `session_id` | string | Required | The call is skipped client-side if this is falsy (`chat.py:91`) |

**EVIDENCE — Client-side guard at `chat.py:90-91`:**
```python
if not session_id or not WRAPPER_URL:
    return []
```
The wrapper is never called with a `None` session_id from this code path.

#### Response (as consumed by Streamlit)

**EVIDENCE — Only the `history` field is read:**

```json
{
  "history": [
    { "role": "<string>", "content": "<string>" },
    ...
  ]
}
```

| Field | Type | Read at | Behavior if missing |
|---|---|---|---|
| `history` | list of `{role, content}` dicts | `chat.py:100` via `.get("history", [])` | Falls back to empty list |

**EVIDENCE — Per-item shape:** Each message item has at minimum `role` and `content` keys, both strings. Source: `chat.py:138-139` iterates `messages` and reads `message["role"]` and `message["content"]`.

**EVIDENCE — `role` values consumed by the UI:** Only `"user"` and `"assistant"` are styled by `st.chat_message(...)`. Other values would render as default but the codebase only writes those two strings.
**Source:** `chat.py:144, 169` (only writes `"user"` and `"assistant"`); `chat-org.py:101-105` maps from ADK's `"USER"/"MODEL"` to lowercase `"user"/"assistant"` — but `chat-org.py` is dead code.

#### Error handling

**EVIDENCE — `chat.py:101-103`:**
- All exceptions caught
- `st.error(f"Failed to fetch history via wrapper: {e}")` rendered
- Returns `[]` — UI shows empty conversation

---

## B. Supabase API

**Configuration:**
- URL: from `st.secrets["SUPABASE_URL"]` (`chat.py:10`)
- Key: from `st.secrets["SUPABASE_KEY"]` (`chat.py:11`)
- Client created at module load: `chat.py:12` `supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)`

---

### B1. Auth — `sign_in_with_password`

**EVIDENCE — Call site:** `chat.py:27-29`

#### Request

```python
supabase.auth.sign_in_with_password({
    "email": email,
    "password": password
})
```

| Field | Type | Required? | Source |
|---|---|---|---|
| `email` | string | Required | `st.text_input("Email")` at `chat.py:21` |
| `password` | string | Required | `st.text_input("Password", type="password")` at `chat.py:22` |

#### Response (as consumed)

**EVIDENCE — Only `auth_response.session` and downstream `session.user.id`, `session.user.email` are read:**

| Path | Type | Read at | Used for |
|---|---|---|---|
| `auth_response.session` | Supabase Session object | `chat.py:30` | Stored to `st.session_state.session` |
| `session.user.id` | string (UUID) | `chat.py:31, 41` | Foreign key for Supabase + identifier for wrapper |
| `session.user.email` | string | `chat.py:51` | Sidebar display |

**EVIDENCE — No `access_token`, `refresh_token`, or expiry fields are explicitly read.** The session object is held opaquely; only `.user.id` and `.user.email` are accessed.
**Source:** grep `st.session_state.session.` in `chat.py` returns only `.user.id` and `.user.email`.

#### Error handling

**EVIDENCE — `chat.py:34-35`:**
- `except Exception as e:` catches all auth failures
- `st.error(f"Authentication failed: {e}")` rendered inline below the form
- `session` remains `None`; user stays on Login screen

---

### B2. Table read — `adk_n8n_hybrid_profiles` SELECT

**EVIDENCE — Call site:** `utils/auth.py:14-25` (`fetch_profile`), invoked at `chat.py:32`.

#### Query

```python
supabase.table("adk_n8n_hybrid_profiles") \
        .select("agent_sessions") \
        .eq("id", user_id) \
        .execute()
```

#### Table schema (inferred from usage)

**EVIDENCE — Columns referenced:**

| Column | Type | Evidence | Notes |
|---|---|---|---|
| `id` | string (UUID) | `.eq("id", user_id)` at `utils/auth.py:17` | INFERENCE: foreign key to `auth.users.id` |
| `agent_sessions` | jsonb (object) | `.select("agent_sessions")`, used as a dict | Shape: `{<agent_name>: <session_id_string>}` |

**EVIDENCE — `agent_sessions` is treated as a `dict[str, str]`:**
- Read with `.get(selected_agent)` (`chat.py:118, 149`)
- Written with `[selected_agent] = new_session_id` (`chat.py:165`)

#### Response handling

**EVIDENCE — `utils/auth.py:18-22`:**
```python
if response.data:
    return response.data[0].get("agent_sessions", {})
return {}
```
- A missing row returns `{}` (new user)
- An existing row's `agent_sessions` (or `{}` if column is null) is returned

#### Error handling

**EVIDENCE — `utils/auth.py:23-25`:**
- `except Exception as e:` catches all errors
- `st.error(f"Error fetching profile: {e}")` rendered
- Returns `{}` — user continues with empty bookmarks

---

### B3. Table write — `adk_n8n_hybrid_profiles` UPSERT

**EVIDENCE — Call site:** `utils/auth.py:28-36` (`save_profile`), invoked at `chat.py:166`.

#### Query

```python
supabase.table("adk_n8n_hybrid_profiles").upsert({
    "id": user_id,
    "agent_sessions": agent_sessions
}).execute()
```

| Field written | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Conflict key for upsert |
| `agent_sessions` | jsonb (object) | Full dict overwrites prior value (not patch/merge) |

**EVIDENCE — Trigger condition (`chat.py:164-166`):**
```python
if new_session_id and new_session_id != current_session_id:
    st.session_state.agent_sessions[selected_agent] = new_session_id
    save_profile(supabase, user_id, st.session_state.agent_sessions)
```
The upsert fires only when the wrapper returns a session_id different from the one the client sent. In practice this happens once per agent per user — on the first message.

#### Error handling

**EVIDENCE — `utils/auth.py:34-36`:**
- `except Exception as e:` catches all
- `st.error(f"Error saving profile: {e}")` rendered
- No retry; the client's in-memory `agent_sessions` is now out-of-sync with Supabase until the next save attempt

#### RLS-relevant context

**EVIDENCE — The Streamlit code uses the Supabase anon key** (`SUPABASE_KEY` from `st.secrets`). For these table operations to succeed under RLS, the `adk_n8n_hybrid_profiles` table must have a policy allowing:
- SELECT WHERE `id = auth.uid()` for the authenticated user
- UPSERT WHERE `id = auth.uid()` for the authenticated user

**INFERENCE — RLS policies are presumed to exist** (otherwise the code would not function), but the policies themselves live in Supabase, not in this repo. Cannot verify from code alone.
**Source:** `.streamlit/secrets.toml:4` (anon-role JWT confirmed via `"role":"anon"` in decoded JWT payload).

---

## C. Google Cloud Storage API

**Configuration:**
- Bucket: `adk-agent-context-ninth-potion-455712-g9` (`utils/gcs_utils.py:4`)
- Base folder: `ADK_Agent_Bundle_1` (`utils/gcs_utils.py:5`)
- Blob path template: `{BASE_FOLDER}/{agent_name}/{agent_name}_instructions.txt`
- Client constructed fresh on each call (`storage.Client()` at lines 9 and 24)

**Auth model — EVIDENCE:** In Cloud Run, the GCS client uses Application Default Credentials from the runtime service account: `stark-vertex-ai@ninth-potion-455712-g9.iam.gserviceaccount.com`. That account has `roles/storage.objectAdmin` granted at the project level by `grant_streamlit_permissions.sh:13-15`. No keys are passed in code.

---

### C1. `download_as_text` — Read instruction blob

**EVIDENCE — Call site:** `utils/gcs_utils.py:7-19` (`fetch_instructions`), invoked at `pages/1_Mission_Control.py:22`.

#### Operation

```python
storage_client = storage.Client()
bucket = storage_client.bucket("adk-agent-context-ninth-potion-455712-g9")
file_path = f"ADK_Agent_Bundle_1/{agent_name}/{agent_name}_instructions.txt"
blob = bucket.blob(file_path)
instructions = blob.download_as_text(encoding='utf-8')
return instructions
```

**EVIDENCE — Content format:** plain UTF-8 text. No JSON, no structure — just the prompt body.

#### Error handling

**EVIDENCE — `utils/gcs_utils.py:17-19`:**
- `except Exception as e:` catches all
- Prints to server stdout (not user-facing)
- **Returns the literal string** `f"Error: Could not load instructions for {agent_name}."` — this string is then displayed inside the text area as if it were the agent's instructions.

---

### C2. `upload_from_string` — Write instruction blob

**EVIDENCE — Call site:** `utils/gcs_utils.py:21-32` (`update_instructions`), invoked at `pages/1_Mission_Control.py:35`.

#### Operation

```python
storage_client = storage.Client()
bucket = storage_client.bucket("adk-agent-context-ninth-potion-455712-g9")
file_path = f"ADK_Agent_Bundle_1/{agent_name}/{agent_name}_instructions.txt"
blob = bucket.blob(file_path)
blob.upload_from_string(new_content, content_type='text/plain')
```

**EVIDENCE — Overwrites in place.** No versioning logic in client code. (GCS bucket-level object versioning, if enabled, is out of scope for this repo.)

#### Error handling

**EVIDENCE — `utils/gcs_utils.py:30-33`:**
- `except Exception as e:` catches all
- Prints to server stdout
- **Re-raises** the exception (`raise` at line 33)
- The caller in `pages/1_Mission_Control.py:34-37` catches the re-raised exception and renders `st.error(...)` instead of `st.toast(...)`

---

## D. Consolidated Data Contracts (for Next.js mock layer)

### D1. `RunAgentRequest` / `RunAgentResponse`

**`RunAgentRequest`** (what the frontend sends):
```typescript
{
  agent_name: string;     // e.g. "greeting_agent"
  message: string;        // user's typed message
  user_id: string;        // Supabase user UUID
  session_id: string | null;  // null on first-ever message to this agent
}
```

**`RunAgentResponse`** (only what the frontend reads):
```typescript
{
  response: string;       // assistant's reply text
  session_id: string;     // wrapper-issued session id
}
```

---

### D2. `GetHistoryRequest` / `GetHistoryResponse`

**`GetHistoryRequest`**:
```typescript
{
  agent_name: string;
  user_id: string;
  session_id: string;     // required; client guards against null
}
```

**`GetHistoryResponse`** (only what the frontend reads):
```typescript
{
  history: Array<{
    role: "user" | "assistant";   // only these two strings appear in this codebase
    content: string;
  }>;
}
```

---

### D3. `ProfileRow` (Supabase `adk_n8n_hybrid_profiles`)

```typescript
{
  id: string;                    // UUID, FK to auth.users.id
  agent_sessions: {
    [agentName: string]: string  // session_id keyed by agent_name
  };
}
```

---

### D4. `LoginRequest` / `LoginResponse`

**`LoginRequest`** (passed to Supabase SDK):
```typescript
{
  email: string;
  password: string;
}
```

**`LoginResponse`** (only what the frontend reads from the Supabase SDK's `auth_response`):
```typescript
{
  session: {
    user: {
      id: string;     // UUID
      email: string;  // displayed in sidebar
    };
    // ...other Supabase fields exist but are not read
  };
}
```

---

### D5. `InstructionBlob` (GCS)

```typescript
// Path: {BUCKET}/{BASE_FOLDER}/{agent_name}/{agent_name}_instructions.txt
// Content-Type: text/plain
// Body: raw UTF-8 string, no schema
type InstructionBlob = string;
```

---

## E. Endpoint-by-Method Summary Table

| Call | Method | Path | Body fields | Read fields from response |
|---|---|---|---|---|
| Chat send | POST | `{WRAPPER}/run_agent` | `agent_name`, `message`, `user_id`, `session_id` | `response`, `session_id` |
| History fetch | POST | `{WRAPPER}/get_history` | `agent_name`, `user_id`, `session_id` | `history[]` (each: `role`, `content`) |
| Login | (Supabase SDK) | `auth.signInWithPassword` | `email`, `password` | `session.user.id`, `session.user.email` |
| Profile read | (Supabase SDK) | `from('adk_n8n_hybrid_profiles').select('agent_sessions').eq('id', user_id)` | n/a | `data[0].agent_sessions` |
| Profile write | (Supabase SDK) | `from('adk_n8n_hybrid_profiles').upsert(...)` | `id`, `agent_sessions` | (no return data read) |
| Instructions read | (GCS SDK) | `bucket.blob(path).download_as_text()` | n/a | raw text |
| Instructions write | (GCS SDK) | `bucket.blob(path).upload_from_string(...)` | text, `content_type='text/plain'` | (no return data read) |

---

## Open Questions

1. **Does the wrapper return additional fields on `/run_agent` (e.g., trace_id, latency, tools_called)?** Cannot be answered from this repo. Streamlit reads only `response` and `session_id`. The Next.js mock will only need to return those two — per APPROVED briefing.
2. **Does `/get_history` return additional metadata per message (timestamp, message_id, agent_id)?** Cannot be answered from this repo. Streamlit reads only `role` and `content` per item.
3. **Mission Control save mechanism** — direct-GCS-from-frontend. Documented as EVIDENCE. Per APPROVED briefing: tag as GAP+QUESTION for Stark to decide whether the Next.js port keeps direct-GCS or routes through a new wrapper endpoint. See `10-RAW-FINDINGS-AND-QUESTIONS.md`.

---

## Verification Checklist

- [x] All findings labeled with evidence tags
- [x] All file references verified to exist
- [x] No invented function names or file paths
- [x] No synthesis or recommendations included
- [x] GAPs explicitly documented
