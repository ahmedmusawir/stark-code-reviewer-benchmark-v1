# 00 — Repo Profile

**Repo:** google-adk-n8n-hybrid-streamlit-v2
**Extraction Date:** 2026-05-23
**Extracted By:** Claude Code
**Status:** FINAL

---

## Summary

This repo is a Streamlit-based web frontend that provides a chat UI and an instructions-editing screen ("Mission Control") for a suite of backend AI agents. It is **frontend-only**: it does not host the agents, the wrapper, or any LLM logic. It speaks to a separately deployed FastAPI "ADK Wrapper" service over HTTP, reads/writes user profiles in Supabase, and reads/writes agent instruction files directly in Google Cloud Storage. Deployed as a serverless container on Google Cloud Run.

---

## Findings

### Project Purpose

**EVIDENCE** — Frontend for "Mission Control" chat experience over a multi-agent backend. Stated purpose: "primary user-facing application for the entire ADK Hybrid system."
**Source:** `docs/overview.md:1-8`

---

### Language & Runtime

**EVIDENCE** — Python 3.12.3.
**Source:** `.python-version:1`

**EVIDENCE** — Single-process Streamlit application.
**Source:** `Procfile:1` → `web: streamlit run chat.py --server.port $PORT --server.enableCORS false`

---

### Entry Points

**EVIDENCE** — Primary entry: `chat.py` (set in `Procfile:1`).

**EVIDENCE** — Multi-page sidebar entry (Streamlit auto-discovery from `pages/`): `pages/1_Mission_Control.py`.
**Source:** `pages/1_Mission_Control.py` exists; Streamlit's documented `pages/` convention auto-mounts it.

**EVIDENCE** — Local launchers:
- `start_chat.sh:3` — `streamlit run ./chat.py --logger.level error` (defaults to local mode)
- `start_cloud.sh:9` — `APP_ENV="cloud" streamlit run ./chat.py --logger.level error`

**EVIDENCE** — Legacy/unused entry: `chat-org.py` exists in the repo but is not referenced by `Procfile`, any `start_*.sh`, or any import.
**Source:** `chat-org.py:1-155`; absence verified by reviewing `Procfile:1`, `start_chat.sh`, `start_cloud.sh`.

---

### Directly-Imported First-Party Modules

**EVIDENCE** — `config.py` (env switch + URL resolver) — imported by `chat.py:7`.
**EVIDENCE** — `utils/auth.py` (gatekeeper + Supabase profile R/W) — imported by `chat.py:6`, `pages/1_Mission_Control.py:3`.
**EVIDENCE** — `utils/gcs_utils.py` (GCS instruction R/W) — imported by `pages/1_Mission_Control.py:2`.

---

### Directly-Imported Third-Party Modules

**EVIDENCE** — From source-grep across `chat.py`, `pages/1_Mission_Control.py`, `utils/auth.py`, `utils/gcs_utils.py`, `config.py`:

| Module | Used In | Purpose |
|---|---|---|
| `streamlit` | All UI files | UI primitives |
| `requests` | `chat.py:2` | HTTP to wrapper |
| `supabase` (`create_client`, `Client`) | `chat.py:5`, `utils/auth.py:3` | Auth + profile table |
| `google.cloud.storage` | `utils/gcs_utils.py:1` | Instruction blob R/W |
| `os`, `json` | `config.py:2-3` | Env + config load |

**EVIDENCE** — Pinned in `requirements.txt`:
- `streamlit==1.48.0`
- `requests==2.32.4`
- `supabase==2.18.1`, `supabase_auth==2.12.3`, `supabase_functions==0.10.1`
- `google-cloud-storage==2.19.0`

**EVIDENCE** — `requirements.txt` is a full environment pip-freeze (153 lines) and contains many packages that no frontend file imports — e.g. `google-adk==0.3.0`, `google-genai==1.28.0`, `litellm==1.66.3`, `openai==1.98.0`, `fastapi==0.116.1`, `uvicorn==0.35.0`, `mcp==1.12.2`, `yfinance==0.2.56`, `peewee==3.18.2`. **INFERENCE:** appears to be a shared/sister-service pip-freeze leak.
**Source:** `requirements.txt:1-153`; absence-of-import verified for sampled names.

---

### File Tree (top 2 levels)

```
google-adk-n8n-hybrid-streamlit-v2/
├── .gcloudignore
├── .gitignore
├── .python-version
├── .streamlit/
│   └── secrets.toml
├── Adk_N8N_Hybrid_v4.json
├── Procfile
├── README.md
├── _SKILLS/                       (this extraction skill family, not app code)
├── chat.py                        (CURRENT entry)
├── chat-org.py                    (LEGACY, dead in current Procfile)
├── config.json
├── config.py
├── deploy.sh
├── docs/
│   ├── config.md
│   ├── deployment.md
│   └── overview.md
├── grant_streamlit_permissions.sh
├── pages/
│   └── 1_Mission_Control.py
├── requirements.txt
├── start_chat.sh
├── start_cloud.sh
├── store_streamlit_secrets.sh
└── utils/
    ├── auth.py
    └── gcs_utils.py
```

**EVIDENCE** — Generated via `ls -la` of repo root and subdirs.

---

### Build / Run / Deploy Commands

**EVIDENCE — Run local (local-mode):** `./start_chat.sh` or `streamlit run ./chat.py`
**Source:** `start_chat.sh:3`

**EVIDENCE — Run local (cloud-mode, points at deployed wrapper):** `./start_cloud.sh` or `APP_ENV=cloud streamlit run ./chat.py`
**Source:** `start_cloud.sh:9`

**EVIDENCE — Deploy to Cloud Run:** `./deploy.sh`
**Source:** `deploy.sh:14-21`:
```
gcloud run deploy adk-streamlit-frontend-v2 \
  --source . --region=us-east1 --project=ninth-potion-455712-g9 \
  --allow-unauthenticated \
  --service-account=stark-vertex-ai@ninth-potion-455712-g9.iam.gserviceaccount.com \
  --set-secrets="SUPABASE_URL=supabase-url:latest,SUPABASE_KEY=supabase-key:latest" \
  --set-env-vars="APP_ENV=cloud,WRAPPER_URL=https://adk-wrapper-prod-v2-952978338090.us-east1.run.app"
```

**EVIDENCE — Bootstrap (one-time):**
- `./grant_streamlit_permissions.sh` — grants `roles/storage.objectAdmin` to the service account (`grant_streamlit_permissions.sh:13-15`)
- `./store_streamlit_secrets.sh` — uploads `.env` values into Google Secret Manager (`store_streamlit_secrets.sh:18-28`)

---

### Cloud Resources Touched By Frontend Code

**EVIDENCE — Supabase:**
- Project URL: `https://zldxzlbkoayhyhzxpjrq.supabase.co` (`.streamlit/secrets.toml:3`)
- Operations: `auth.sign_in_with_password`, `table("adk_n8n_hybrid_profiles")` `.select()` and `.upsert()`

**EVIDENCE — Google Cloud Storage:**
- Bucket: `adk-agent-context-ninth-potion-455712-g9` (`utils/gcs_utils.py:4`)
- Base folder: `ADK_Agent_Bundle_1` (`utils/gcs_utils.py:5`)
- Blob path template: `{BASE_FOLDER}/{agent_name}/{agent_name}_instructions.txt`

**EVIDENCE — ADK Wrapper (HTTP):**
- Local: `http://localhost:8080` (`config.json:4`)
- Cloud: `https://adk-wrapper-prod-v2-952978338090.us-east1.run.app` (`config.json:8`)
- Endpoints consumed: `POST /run_agent`, `POST /get_history`

**EVIDENCE — `ADK_BUNDLE_URL`** is imported from `config.py` into `chat.py:7` but is not referenced anywhere in `chat.py` body. Imported and unused.
**Source:** `chat.py:7`, grep of `chat.py` for `ADK_BUNDLE_URL` returns only the import line.

---

### Environment Variables

**EVIDENCE — `APP_ENV`** — Switch between `local` and `cloud` config blocks. Defaults to `local`.
**Source:** `config.py:11`

**EVIDENCE — `WRAPPER_URL`** — Set in `deploy.sh:21` via `--set-env-vars`. **Not consumed by `config.py`** (which reads URLs from `config.json` keyed by `APP_ENV`). INFERENCE: this env var appears to be set redundantly and is ignored by the code path; the actual URL comes from `config.json`.
**Source:** `deploy.sh:21` (sets it); `config.py:1-39` (does not read it).

---

### Configuration & Secrets

**EVIDENCE — `config.json`** ships in the deployed artifact (kept by `.gcloudignore` `!config.json` exception).
**Source:** `.gcloudignore:18`

**EVIDENCE — Secrets in cloud:** Injected by Cloud Run from Secret Manager as `SUPABASE_URL=supabase-url:latest, SUPABASE_KEY=supabase-key:latest`. The Streamlit code reads them via `st.secrets["SUPABASE_URL"]` / `st.secrets["SUPABASE_KEY"]`.
**Source:** `deploy.sh:20`, `chat.py:10-11`

**EVIDENCE — Secrets in local:** `.streamlit/secrets.toml` exists in the repo and contains a Supabase URL + anon key.
**Source:** `.streamlit/secrets.toml:3-4`. Cross-reference: `10-RAW-FINDINGS-AND-QUESTIONS.md` for the committed-key observation.

---

### Legacy / Unused Artifacts

**EVIDENCE — `Adk_N8N_Hybrid_v4.json`** — n8n workflow export. Three nodes (Webhook → Code → HTTP Request → Code → Respond). The HTTP Request node targets `http://localhost:8080/run_agent`. This is the n8n orchestrator from the prior architecture.
**Source:** `Adk_N8N_Hybrid_v4.json:7-30, 74-83`

**EVIDENCE — `chat-org.py`** — Earlier version of `chat.py` that called the n8n webhook directly (`N8N_WEBHOOK_URL = "http://127.0.0.1:5678/webhook/f11820f4-..."`) and fetched history straight from the ADK server (`GET {ADK_SERVER_URL}/apps/{agent}/users/{user_id}/sessions/{session_id}`). Not referenced by `Procfile` or any start script.
**Source:** `chat-org.py:71-72, 89-109`

---

## Open Questions

None — this doc is pure inventory.

---

## Verification Checklist

- [x] All findings labeled with evidence tags
- [x] All file references verified to exist
- [x] No invented function names or file paths
- [x] No synthesis or recommendations included
- [x] GAPs explicitly documented
