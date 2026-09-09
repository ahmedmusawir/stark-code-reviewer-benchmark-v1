# 07 — Guardrails and Sandboxing

**Repo:** google-adk-n8n-hybrid-streamlit-v2
**Extraction Date:** 2026-05-23
**Extracted By:** Claude Code
**Status:** FINAL
**Focus Lens:** SECONDARY

---

## Summary

The frontend's only guardrails are an auth gate on the Chat page and a page-level `gatekeeper()` on Mission Control. There is no client-side input validation, no role-based access control, no rate limiting, no CSRF protection visible in this code (Streamlit handles its own session continuity but no explicit CSRF tokens are issued). Sandboxing concerns are essentially nil — the frontend executes no agent code, no shell commands, no eval. It's a pass-through UI.

---

## Findings

### Auth Gate — Chat Screen (Login Wall)

**EVIDENCE — `chat.py:14-18`:**
```python
if 'session' not in st.session_state:
    st.session_state.session = None

if st.session_state.session is None:
    # render login form (lines 19-35)
```

**EVIDENCE — Effect:** The authenticated branch (lines 40+) is unreachable until `session` is non-`None`. There is no path to bypass the form.

**EVIDENCE — How session is populated:** Only by successful `supabase.auth.sign_in_with_password` (`chat.py:30`). There is no other code path that sets `session`.

---

### Page Guard — `gatekeeper()`

**EVIDENCE — `utils/auth.py:5-12`:**
```python
def gatekeeper():
    if 'session' not in st.session_state or st.session_state.session is None:
        st.warning("⚠️ You must be logged in to access this page.")
        st.info("Please log in through the main 'chat' page to continue.")
        st.stop()
```

**EVIDENCE — Invoked at:**
- `pages/1_Mission_Control.py:6` — first executable statement after imports

**EVIDENCE — Behavior:**
- If unauthenticated: renders warning + info callouts, calls `st.stop()` → page renders nothing else
- If authenticated: returns silently, page continues rendering

**EVIDENCE — No redirect.** The user is not automatically taken to the login screen; they must click the sidebar's "chat" link manually.

**EVIDENCE — No session validation beyond presence.** The gatekeeper does not check expiry, signature, or whether the Supabase session is still valid server-side. A stale `session` object would pass the gate. Verification is implicitly delegated to downstream Supabase calls (e.g., the `fetch_profile` query would fail under RLS if the JWT is stale).

---

### Role / Permission Checks

**GAP — None.** There is no role-based check anywhere in the codebase. Any authenticated user can:
- Reach Mission Control
- Edit and save agent instructions (writes to GCS)

**EVIDENCE — `gatekeeper()` is a binary check** (logged in or not). There is no admin vs. non-admin distinction.
**Source:** `utils/auth.py:5-12`; absence of any `role`/`is_admin` references in the codebase.

**INFERENCE — Mission Control is effectively a god-mode panel** for any authenticated user. Whether this matches intent is out of scope; documented as observation.

---

### Client-Side Input Validation

**GAP — None on user inputs.**

**EVIDENCE — Login form (`chat.py:21-22`):** No email-format check, no min-password-length check. Email validation is delegated entirely to Supabase.

**EVIDENCE — Chat input (`chat.py:142`):** No max-length, no profanity filter, no sanitization. The raw prompt string is sent to the wrapper as-is.

**EVIDENCE — Mission Control text area (`pages/1_Mission_Control.py:25-30`):** No max-length, no schema validation, no diff preview. The raw text replaces the GCS blob on save.

---

### Output Sanitization / Render Safety

**EVIDENCE — `st.markdown(message["content"])` (`chat.py:139`) renders content with full markdown semantics**, including code blocks, links, and images. By default, Streamlit's `st.markdown` does NOT enable `unsafe_allow_html`; raw HTML in messages is escaped.
**Source:** `chat.py:139` (`st.markdown(message["content"])` with no `unsafe_allow_html=True` parameter).

**EVIDENCE — Same is true for the Mission Control subtitle** (`pages/1_Mission_Control.py:10`).

**EVIDENCE — `st.sidebar.info(f"Chatting with: **{selected_agent}**")` (`chat.py:108`)** uses literal markdown (`**bold**`) — this works because `st.info` itself renders markdown. The interpolated `selected_agent` is a value from a static dropdown, so injection risk is nil.

**INFERENCE — XSS via markdown is bounded** because Streamlit's default markdown rendering is HTML-escaped. If an agent's response contained malicious HTML, it would be rendered as text.

---

### Transport Security

**EVIDENCE — Cloud-mode wrapper URL is HTTPS** (`config.json:8`): `https://adk-wrapper-prod-v2-952978338090.us-east1.run.app`
**EVIDENCE — Local-mode wrapper URL is HTTP** (`config.json:4`): `http://localhost:8080` — acceptable for local dev.

**EVIDENCE — Supabase URL is HTTPS** (`.streamlit/secrets.toml:3`): `https://zldxzlbkoayhyhzxpjrq.supabase.co`

**EVIDENCE — Cloud Run service is deployed `--allow-unauthenticated`** (`deploy.sh:18`). The Streamlit app itself is public; gate is implemented by the Supabase login form.

---

### Secrets Management

**EVIDENCE — Cloud deployment** (`deploy.sh:20`):
```
--set-secrets="SUPABASE_URL=supabase-url:latest,SUPABASE_KEY=supabase-key:latest"
```
Secrets are injected from Google Secret Manager as environment-like values readable via `st.secrets`.

**EVIDENCE — Local secrets file (`.streamlit/secrets.toml`) is committed to the repo** and contains a Supabase URL + anon key. The anon key is a publicly-publishable JWT in normal Supabase usage (it's identified by `"role":"anon"` in the JWT payload), but its presence in git is documented as EVIDENCE in `10-RAW-FINDINGS-AND-QUESTIONS.md` per APPROVED briefing.

---

### CORS / CSRF

**EVIDENCE — `Procfile:1`** starts Streamlit with `--server.enableCORS false`. **INFERENCE:** this disables Streamlit's CORS middleware (which is enabled by default).

**GAP — No CSRF tokens visible.** Streamlit handles its own session continuity via cookies; there is no explicit CSRF token in any HTTP call to the wrapper.

---

### Wrapper-Call Authentication

**EVIDENCE — The Streamlit code does NOT send any auth header on `/run_agent` or `/get_history` calls.**

```python
# chat.py:80
response = requests.post(f"{WRAPPER_URL}/run_agent", json=payload, timeout=90)
# chat.py:98
response = requests.post(f"{WRAPPER_URL}/get_history", json=payload, timeout=30)
```

No `headers=`, no `Authorization` header, no bearer token, no API key.

**INFERENCE — The wrapper either trusts callers identified by `user_id` in the JSON body, or relies on network-layer protections** (e.g., Cloud Run's `--allow-unauthenticated` flag means the wrapper is internet-accessible). Documented as observation; the wrapper's auth model is out of scope.

**Source:** `chat.py:80, 98`; absence of any header construction in `call_agent_wrapper` and `fetch_history`.

---

### Supabase Row-Level Security Reliance

**EVIDENCE — `utils/auth.py:17`:**
```python
supabase.table("adk_n8n_hybrid_profiles").select("agent_sessions").eq("id", user_id).execute()
```

**EVIDENCE — The client uses the ANON key** (`.streamlit/secrets.toml:4`, role=`anon`). For RLS-protected tables, Supabase requires the authenticated JWT to be set on the client.

**INFERENCE — The `supabase` client at `chat.py:12` is created once at module load with the anon key, but the client object is presumed to attach the user's JWT after `sign_in_with_password` succeeds.** The `supabase-py` SDK's default behavior is to attach the JWT to subsequent table calls after login. Verified behavior from code alone: not explicitly visible, but the SDK contract per `supabase==2.18.1` enforces it.

**GAP — No explicit `supabase.auth.set_session(...)` or token refresh in the code.** The frontend trusts the SDK to keep the session attached. If the JWT expires mid-session, Supabase calls would fail (and `st.error` would render).

---

### GCS Auth Model

**EVIDENCE — `utils/gcs_utils.py:9, 24`:**
```python
storage_client = storage.Client()
```
With no arguments, the Google Cloud SDK uses Application Default Credentials. In Cloud Run, this is the runtime service account: `stark-vertex-ai@ninth-potion-455712-g9.iam.gserviceaccount.com` (per `deploy.sh:8`).

**EVIDENCE — That service account has `roles/storage.objectAdmin` at the project level** (`grant_streamlit_permissions.sh:13-15`).

**INFERENCE — Any authenticated user of the Streamlit app effectively wields the service account's GCS write power for the instruction blobs.** No per-user permission scoping exists between the Streamlit auth layer and the GCS layer.

---

### Sandboxing of Agent Inputs

**GAP — None applicable.** The frontend does not execute agent code, render agent-generated HTML unsafely, or evaluate any code received from the wrapper. Agent output is rendered as markdown text only.

---

### Input → Output Mapping (Trust Boundaries)

| Input | Origin | Trust level | Sanitization |
|---|---|---|---|
| Login email/password | User keyboard | Untrusted | None (delegated to Supabase) |
| Chat prompt | User keyboard | Untrusted | None — sent to wrapper raw |
| Instruction text | User keyboard (admin) | Trusted-by-default (all auth'd users) | None — sent to GCS raw |
| Wrapper response | ADK Wrapper | Trusted | Rendered as markdown (HTML escaped by default) |
| Supabase profile data | Database | Trusted | None — used as keys for HTTP calls |
| GCS instruction blob | Storage | Trusted | None — displayed in text area |
| Agent name (selectbox) | Static config | Trusted | N/A |

**INFERENCE — No untrusted input is interpreted as code or HTML by the frontend.** The attack surface from the frontend's perspective is shaped almost entirely by the wrapper's behavior.

---

### `st.stop()` as a "Halt" Primitive

**EVIDENCE — Used once:** `utils/auth.py:13` in `gatekeeper()`.

**INFERENCE — This is the only "kill switch" in the codebase.** It is a Streamlit-specific abort that terminates the current script run without raising an exception.

---

## Open Questions

1. **Does the wrapper validate `user_id`** sent in `/run_agent` and `/get_history` requests against an out-of-band session token? Cannot answer from this repo. The frontend simply sends the Supabase user UUID in the JSON body.
2. **Are there any Supabase RLS policies on `adk_n8n_hybrid_profiles`** that prevent user A from reading/writing user B's row? Presumed yes (otherwise the anon-key client would be a vulnerability), but not visible in this repo.
3. **Should Mission Control require an admin role?** Currently any logged-in user can edit any agent's instructions. Documented as EVIDENCE; not flagged as a bug — possibly intentional in a single-team-tool context.

---

## Verification Checklist

- [x] All findings labeled with evidence tags
- [x] All file references verified to exist
- [x] No invented function names or file paths
- [x] No synthesis or recommendations included
- [x] GAPs explicitly documented
