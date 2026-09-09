# _extraction — Brain Drain Extraction Docs

Drop the 11 evidence-labeled Brain Drain extraction documents here.

For Cyberize (Run 001), this folder should contain:
- `00-REPO-PROFILE.md` — repo identity, file tree, entry points, dependencies
- `01-EXISTING-DOCS-REVIEW.md` — existing docs validated against code
- `02-ARCHITECTURE-MAP.md` — FLOW MAP: login → chat → switch → save → logout
- `03-AGENT-LOOP.md` — request/response lifecycles
- `04-TOOL-SYSTEM.md` — API SURFACE (wrapper HTTP, Supabase, GCS)
- `05-CONTEXT-AND-MEMORY.md` — st.session_state, Supabase row, GCS blobs
- `06-PROMPTS-AND-PERSONA.md` — SCREEN INVENTORY (the fattest doc)
- `07-GUARDRAILS-AND-SANDBOXING.md` — auth gates, RLS, transport security
- `08-ERROR-HANDLING-AND-RECOVERY.md` — try/except map, sentinels, no-retry pattern
- `09-TESTS-AND-EVALS.md` — none in source (GAP)
- `10-RAW-FINDINGS-AND-QUESTIONS.md` — drifts, dead code, top 5 discoveries

These docs are referenced on demand during the run for ambiguity resolution. They are NOT mandatory reading in Phase 0 — only the project handoff docs in `_project/` are mandatory.

For future runs: replace with new Brain Drain output for the new source app.
