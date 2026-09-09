# 01 — Existing Docs Review

**Repo:** google-adk-n8n-hybrid-streamlit-v2
**Extraction Date:** 2026-05-23
**Extracted By:** Claude Code
**Status:** FINAL

---

## Summary

The repo ships three documentation files in `docs/` plus a 2-line `README.md`. The docs accurately describe the high-level architecture, deployment process, and configuration strategy. Most claims are CONFIRMED by the source code. A few claims are CONTRADICTED or UNVERIFIED. There is no in-repo documentation of the per-screen UI behavior, the wrapper API surface, or the Mission Control screen's mechanics — the docs cover the *system around* the code, not the code's own behavior.

---

## Findings

### README.md

**EVIDENCE — Full content (2 lines):**
> "# google-adk-n8n-hybrid-streamlit-v2
> ADK Frontend v2: This will be pushed to google cloud connecting to adk bundle & wrapper w/ cloud postgres db for long term memory"

**Status: UNVERIFIED (Cloud Postgres claim)** — The README mentions "cloud postgres db for long term memory" but the frontend code never connects to Postgres. The Postgres connection (if any) would live in the wrapper, which is not in this repo. **GAP** in scope: no Postgres references in any first-party file of this repo.
**Source:** `README.md:2`; grep of `*.py` for "postgres" returns no matches.

---

### docs/overview.md — Claims Reviewed

#### Claim 1: "primary user-facing application"
**Status: CONFIRMED** — `Procfile:1` starts `chat.py` as the web entry; no other user-facing process is in the repo.
**Source:** `docs/overview.md:1-8`, `Procfile:1`

#### Claim 2: "Secure User Authentication... using Supabase"
**Status: CONFIRMED** — `chat.py:10-12, 27-29` instantiates Supabase and calls `auth.sign_in_with_password`.
**Source:** `docs/overview.md:14`, `chat.py:10-12, 27-29`

#### Claim 3: "Agent Selection: A simple dropdown menu... from a centrally managed list"
**Status: CONFIRMED** — `chat.py:107` renders `st.sidebar.selectbox("Choose an agent:", options=AGENT_OPTIONS)`; `AGENT_OPTIONS` is sourced from `config.json:13-18` via `config.py:35`.
**Source:** `docs/overview.md:15`, `chat.py:107`, `config.py:35`

#### Claim 4: "Interactive Chat UI... real-time chat interface"
**Status: CONFIRMED-with-caveat** — `chat.py:137-172` renders messages and accepts input via `st.chat_input`. **EVIDENCE caveat:** the round-trip is synchronous and blocking — the entire script reruns after the response arrives. There is no token streaming. "Real-time" in the docs == "interactive turn-by-turn", not server-sent events.
**Source:** `docs/overview.md:16`, `chat.py:142-172`

#### Claim 5: "Persistent Sessions... saved to the user's Supabase profile"
**Status: CONFIRMED** — `chat.py:163-166` calls `save_profile()`; `utils/auth.py:14-25, 28-36` reads/writes the `adk_n8n_hybrid_profiles` table's `agent_sessions` column.
**Source:** `docs/overview.md:17`, `utils/auth.py:14-36`

#### Claim 6: "Decoupled Communication... proxied through the ADK Wrapper"
**Status: CONFIRMED** — `chat.py:80` (POST `/run_agent`), `chat.py:98` (POST `/get_history`). The frontend does not call the ADK bundle directly.
**Source:** `docs/overview.md:18`, `chat.py:80, 98`

#### Claim 7: "Technology Stack: Python with Streamlit"
**Status: CONFIRMED** — `requirements.txt:127` pins `streamlit==1.48.0`.

#### Claim 8: "Deployed as a serverless container on Google Cloud Run"
**Status: CONFIRMED** — `deploy.sh:14` uses `gcloud run deploy`.

---

### docs/config.md — Claims Reviewed

#### Claim 9: "config.json is the primary source of truth for environment-specific settings and the list of available agents"
**Status: CONFIRMED-with-CONTRADICTION** — CONFIRMED for `chat.py` which reads `AGENT_OPTIONS` from `config.json` via `config.py`. **CONTRADICTED** by `pages/1_Mission_Control.py:13` which **hardcodes a separate, shorter list** (`["greeting_agent", "calc_agent", "jarvis_agent", "product_agent"]`, missing `ghl_mcp_agent`). The "central source of truth" claim does not hold across the whole app.
**Source:** `docs/config.md`, `config.py:35`, `pages/1_Mission_Control.py:13`

#### Claim 10: "APP_ENV acts as a switch between environments... defaults to local"
**Status: CONFIRMED** — `config.py:11` `env = os.getenv("APP_ENV", "local").lower()`.
**Source:** `docs/config.md`, `config.py:11`

#### Claim 11: "In the Google Cloud Run deployment, deploy.sh explicitly sets APP_ENV=cloud"
**Status: CONFIRMED** — `deploy.sh:21` `--set-env-vars="APP_ENV=cloud,WRAPPER_URL=..."`.

#### Claim 12: "Secrets are managed using Streamlit's built-in secrets functionality"
**Status: CONFIRMED** — `chat.py:10-11` reads `st.secrets["SUPABASE_URL"]`, `st.secrets["SUPABASE_KEY"]`.

#### Claim 13: "In Cloud Run, secrets are securely injected from Google Secret Manager"
**Status: CONFIRMED** — `deploy.sh:20` `--set-secrets="SUPABASE_URL=supabase-url:latest,SUPABASE_KEY=supabase-key:latest"`.

---

### docs/deployment.md — Claims Reviewed

#### Claim 14: "the service needs permission to read and write to Google Cloud Storage"
**Status: CONFIRMED** — `grant_streamlit_permissions.sh:13-15` grants `roles/storage.objectAdmin`; `utils/gcs_utils.py:7-32` performs both read (`download_as_text`) and write (`upload_from_string`).

#### Claim 15: ".gcloudignore... includes an exception to ensure config.json is deployed"
**Status: CONFIRMED** — `.gcloudignore:18` `!config.json`.

#### Claim 16: "Procfile gives Cloud Run the explicit command needed to start Streamlit"
**Status: CONFIRMED** — `Procfile:1` `web: streamlit run chat.py --server.port $PORT --server.enableCORS false`.

---

### What The Docs DON'T Cover (GAPs in documentation)

**GAP** — No documentation of the wrapper API contract (endpoint paths, request shapes, response shapes). The docs say "decoupled communication" without specifying the wire format.
**Source:** absence in `docs/overview.md`, `docs/config.md`, `docs/deployment.md`.

**GAP** — No documentation of the Mission Control screen. `docs/overview.md` lists features but does not mention the instruction editor at all.
**Source:** `docs/overview.md` reviewed end-to-end; no mention of `pages/`, instructions, or GCS-based content editing.

**GAP** — No documentation of the Supabase schema (`adk_n8n_hybrid_profiles` table, `agent_sessions` column shape).
**Source:** absence in all doc files; only inferable from `utils/auth.py:14-36`.

**GAP** — No documentation of the per-user session-resume behavior beyond a single sentence in overview.md. Behavior detail (when a session id is created, how stale ids are handled) is only in code.

**GAP** — No documentation of `chat-org.py` — its existence, whether it is dead or active, why it remains in the tree.

**GAP** — No documentation of `Adk_N8N_Hybrid_v4.json` — its role in the current architecture (the README still mentions "n8n hybrid" in the repo name, but the active `chat.py` does not use n8n).

---

### CONTRADICTED Claims Summary

| # | Doc claim | Code says |
|---|---|---|
| 9 | `config.json` is the central source of truth for the agent list | `pages/1_Mission_Control.py:13` overrides with a hardcoded 4-agent list |
| Implicit (repo name) | "n8n hybrid" | `chat.py` (the active entry) does not call n8n; the n8n workflow JSON is present but the active code path bypasses it |

---

## Open Questions

1. Is `chat-org.py` retained for historical diff/comparison, or is there a path that still uses it? **Resolution per APPROVED briefing: dead code reference, not a screen.**
2. Is `ghl_mcp_agent`'s absence from the Mission Control hardcoded list intentional (some agents may not have editable instructions) or a bug? **Forwarded to 10-RAW-FINDINGS.**

---

## Verification Checklist

- [x] All findings labeled with evidence tags
- [x] All file references verified to exist
- [x] No invented function names or file paths
- [x] No synthesis or recommendations included
- [x] GAPs explicitly documented
