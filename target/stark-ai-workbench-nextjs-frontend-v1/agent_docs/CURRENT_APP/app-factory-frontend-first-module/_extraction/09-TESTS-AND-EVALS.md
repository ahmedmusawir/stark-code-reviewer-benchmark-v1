# 09 — Tests and Evals

**Repo:** google-adk-n8n-hybrid-streamlit-v2
**Extraction Date:** 2026-05-23
**Extracted By:** Claude Code
**Status:** FINAL
**Focus Lens:** STANDARD-LEAN

---

## Summary

There are no tests in this repo. `pytest`, `pytest-asyncio`, and `pytest-mock` are pinned in `requirements.txt` (transitive leak from a sister project, almost certainly), but no `tests/` directory, no `*_test.py` files, no `test_*.py` files, no test fixtures, no CI test commands, no coverage configuration. This is a fully untested codebase.

---

## Findings

### Test Files Present

**GAP — None.**

**EVIDENCE — Search results:**
- No `tests/` directory at any level
- No file matching `*_test.py` or `test_*.py` in first-party code
- No `conftest.py`
- No `pytest.ini`, `pyproject.toml`, or `setup.cfg`

**Source:** Glob search of repo for `**/test_*.py` and `**/*_test.py` returns no first-party matches.

---

### Test Framework Dependencies in `requirements.txt`

**EVIDENCE — `requirements.txt:104-106`:**
```
pytest==8.4.1
pytest-asyncio==1.1.0
pytest-mock==3.14.1
```

**INFERENCE — These appear to be pip-freeze leakage from a sister project's virtualenv** (likely the ADK Wrapper or ADK Bundle, both of which may have tests). They are pinned but not used by this repo.

---

### CI / CD Test Steps

**GAP — None.**

**EVIDENCE — No `.github/`, no `.gitlab-ci.yml`, no `cloudbuild.yaml`, no `Jenkinsfile`, no `.circleci/`** at the repo root.
**Source:** Glob for `.github/**`, etc. returns no matches.

**EVIDENCE — Only deployment scripts exist:** `deploy.sh`, `start_chat.sh`, `start_cloud.sh`, `store_streamlit_secrets.sh`, `grant_streamlit_permissions.sh`. None of these invoke `pytest`.

---

### Evaluation / Quality Harness

**GAP — None.** No eval scripts, no benchmark harness, no golden-output comparison, no regression suite.

**INFERENCE — Quality assurance for this frontend appears to be entirely manual** — the architect (Stark) runs the app locally or in cloud and observes behavior.

---

### Linting / Type Checking

**GAP — No linting or type-checking configuration in this repo.**

**EVIDENCE — No `.ruff.toml`, `.flake8`, `mypy.ini`, `pyrightconfig.json`, or `pylintrc`.**
**Source:** Glob across repo root and known config locations.

**EVIDENCE — `ruff` and `mypy` cache patterns are listed in `.gitignore:159, 192`**, suggesting these tools may be run ad-hoc but no project-level config commits the convention.

---

### Code Quality Observations Worth Flagging (Not Recommendations)

**EVIDENCE — `chat-org.py:121` contains commented-out variable migration code** — vestige of a refactor from `st.session_state.user_id` to a local `user_id` variable:
```python
# st.session_state.messages = fetch_history(selected_agent, st.session_state.user_id, resumed_session_id)
# AFTER
st.session_state.messages = fetch_history(selected_agent, user_id, resumed_session_id)
```

**EVIDENCE — `chat.py:125-127` contains commented-out stale-session purge** (documented in `08-ERROR-HANDLING-AND-RECOVERY.md`).

**EVIDENCE — Debug `print` statements active in production code path** (`chat.py:61, 75-77, 88`). Documented in `08-`.

---

## Open Questions

1. Should the Next.js port introduce a test suite? Out of scope for extraction.
2. Are there tests in the ADK Wrapper repo that exercise the frontend's expected request shapes? Cannot answer from this repo.

---

## Verification Checklist

- [x] All findings labeled with evidence tags
- [x] All file references verified to exist
- [x] No invented function names or file paths
- [x] No synthesis or recommendations included
- [x] GAPs explicitly documented
