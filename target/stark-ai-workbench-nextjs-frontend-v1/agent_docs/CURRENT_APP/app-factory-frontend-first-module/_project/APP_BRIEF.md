# APP_BRIEF.md — Cyberize Agentic Automation (Next.js Conversion)

> **Project:** Cyberize Agentic Automation — Next.js Frontend v1
> **Origin:** Conversion of `google-adk-n8n-hybrid-streamlit-v2` (Streamlit)
> **Phase:** Frontend-First (Phase 1)
> **Owner:** Stark Industries AI App Factory
> **Date:** 2026-05-23
> **Version:** 1.0

---

## 1. App Type

**Internal Operator Tool — Multi-Agent Chat Console**

Authenticated chat interface for an operator (or small team) to converse with a fleet of backend AI agents, plus an admin panel to live-edit each agent's instruction text.

---

## 2. One-Sentence Purpose

A Next.js + Shadcn + Tailwind frontend that lets an authenticated user select an agent from a dropdown, chat with that agent through an existing FastAPI wrapper, and (on a separate page) edit each agent's instruction text — all without rewriting any existing backend.

---

## 3. Who Uses This

- **Primary user:** Tony Stark (operator). Single-tenant in practice today.
- **Secondary users:** Small team of authorized teammates with Supabase accounts in the `adk_n8n_hybrid_profiles` table.
- **Not for:** End customers. Not a public product.

---

## 4. Why We're Building It

The existing Streamlit version works but cannot evolve into a real product:
- Streamlit constrains UX customization
- Cannot grow into a multi-page, role-aware product
- Stark's portfolio thesis is Next.js + Shadcn, not Streamlit
- The Factory needs its first real conversion run to forge the 10x Factory playbook

This is **Run 001** of the Factory's frontend conversion pipeline. The output app matters. The forging of the Factory matters more.

---

## 5. In Scope (Phase 1)

**Three screens — mirroring the Streamlit app exactly:**

### Screen A — Login
- Supabase email + password authentication
- Error feedback on failure
- Redirect to Chat on success

### Screen B — Chat (authenticated)
- Sidebar with auth status + Logout
- Agent dropdown (5 agents from a configured registry)
- Conversation message list (user + assistant bubbles, markdown rendering, table rendering)
- Chat input anchored to bottom
- Loading state during agent response ("Agent is thinking...")
- History fetch on agent switch
- Session bookmark persistence per agent (in Supabase)

### Screen C — Mission Control (authenticated)
- Title + subtitle
- Per-agent repeating block: section header, instructions textarea (250px tall), Save button, success toast / error callout
- Live edit of instruction text per agent
- Save persists changes (to mock storage in Phase 1; real GCS in Phase 2)

### Cross-cutting
- Sidebar navigation between Chat and Mission Control
- Gatekeeper redirect when unauthenticated users hit Mission Control
- Mobile responsive at 375px, 768px, 1024px breakpoints
- Service layer with mock data behind every external call

---

## 6. Out of Scope (Phase 1) — HARD GATES

These will NOT be built. If a task drifts toward any of these, STOP and surface.

1. **No backend code authoring.** Wrapper stays untouched. No new API routes. No Supabase migrations. No GCS write logic of our own.
2. **No real wrapper calls.** All `/run_agent` and `/get_history` traffic is mocked behind the service layer.
3. **No real Supabase calls except auth** (auth is wired via starter kit). Profile read/write is mocked.
4. **No real GCS calls.** Instruction read/write is mocked.
5. **No streaming.** The Streamlit original is request-response; we match that.
6. **No new UI features** not present in the Streamlit original. No "clear conversation" button. No session info display. No agent metadata beyond name.
7. **No design improvements** beyond Shadcn/Tailwind defaults applied to the existing screen layouts.
8. **No replacement of the wrapper middleware** with Next.js API routes. (That's Phase 3, handled manually by Stark.)
9. **No production deployment.** Phase 1 ends at `npm run build` succeeding and a clean staging deploy URL.
10. **No security hardening** beyond what the starter kit provides (Stark Skills territory).
11. **No fixing of inconsistencies** found in extraction. The Mission Control agent list drift (4 vs 5 agents) stays as-is per Stark's call.
12. **No tests** beyond what the Engineer Playbook's TDD flow requires for component-level confidence. No E2E suite. No coverage gates.
13. **No CI/CD setup.** Manual `npm run build` is the verification.
14. **No analytics, telemetry, error tracking.** Not in the Streamlit original; not in Phase 1.
15. **No internationalization.** English only, matching the original.

---

## 7. Success Criteria

Phase 1 is COMPLETE when ALL of these are true:

- [ ] Login screen authenticates against the live Supabase project (real auth, not mock)
- [ ] Authenticated users land on Chat screen with the agent dropdown populated from a config
- [ ] Selecting an agent triggers a mocked history fetch and renders messages
- [ ] Sending a message renders the user bubble, shows a loading indicator, and renders a mocked assistant response
- [ ] Markdown in assistant responses renders correctly (including tables — see UI_SPEC)
- [ ] Agent switching preserves session bookmarks across reloads (via mocked Supabase profile)
- [ ] Mission Control page is gated and renders 4 agent blocks (matching the Streamlit hardcoded list)
- [ ] Editing and saving instructions triggers a success toast (mocked save)
- [ ] Unauthenticated direct access to Mission Control shows the gatekeeper warning + info callouts
- [ ] Mobile responsive verified at 3 breakpoints
- [ ] `npm run build` succeeds with zero errors
- [ ] Service layer methods all have BACKEND_SWAP_NOTES indicating where the real backend hooks in (Phase 2)
- [ ] Stark has demoed the staging URL and approved the UI

---

## 8. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router only — no Pages Router patterns) |
| Language | TypeScript |
| Styling | Tailwind CSS + Shadcn primitives |
| State | Zustand (app-level), useState (local) |
| Markdown | `react-markdown` + `remark-gfm` (table support) |
| Auth | Supabase (via starter kit) |
| HTML rendering | `html-react-parser` (NEVER `dangerouslySetInnerHTML`) |
| Mock data | In-service typed mocks (Pattern A from SERVICE_LAYER_PATTERNS) |
| Testing | Vitest (component-level only in Phase 1) |
| Deployment | Vercel staging (Phase 1) → Cloud Run (Phase 3, manual) |

---

## 9. Source-of-Truth Artifacts

All downstream work references these files in this priority order:

1. **APP_BRIEF.md** — this file, what we're building
2. **DATA_CONTRACT.md** — every data shape
3. **UI_SPEC.md** — screen-by-screen behavior
4. **CLAUDE.md** (project root) — the spine, read by Claudy every session
5. **Extraction docs** (`_extraction/`) — the raw evidence, pulled on demand for ambiguity resolution

If any source conflicts with another, **`DATA_CONTRACT.md` wins on data shapes, `UI_SPEC.md` wins on UI behavior, this brief wins on scope.** Conflicts get surfaced, not silently resolved.

---

## 10. Known Discrepancies (Per Extraction)

These are intentionally preserved from the original — not fixed in Phase 1.

| # | Discrepancy | Source | Disposition |
|---|---|---|---|
| 1 | Mission Control hardcodes 4 agents; chat config has 5 | F1 in 10-RAW-FINDINGS | KEEP AS-IS — preserve original behavior. Document for Phase 2. |
| 2 | `chat-org.py` dead code exists | F2 in 10-RAW-FINDINGS | IGNORE — do not port |
| 3 | `Adk_N8N_Hybrid_v4.json` legacy artifact exists | F3 in 10-RAW-FINDINGS | IGNORE — do not port |
| 4 | Stale-session purge logic commented out | F10 in 10-RAW-FINDINGS | LEAVE OUT — preserve original behavior |
| 5 | Logout does not call `auth.signOut()` server-side | F3 in 08-ERROR-HANDLING | KEEP AS-IS — preserve original behavior |

These are recorded so Phase 2 inherits a clean checklist of decisions to revisit.

---

## 11. Constraints

- **No design phase.** The Streamlit screenshots ARE the design.
- **No new features.** Faithful 1:1 conversion only.
- **Service layer discipline is mandatory.** Every external call routes through `/src/services/`.
- **Plan Mode is mandatory.** Inherited from global CLAUDE.md and the `stark-frontend-first` skill.
- **Eyesight-aware communication.** Explanations before code blocks, always.

---

## 12. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Mock data shapes drift from real wrapper response | Phase 2 swap breaks | DATA_CONTRACT.md is the single source of truth; mocks must match exactly |
| Chat scroll-to-bottom behavior is fiddly in React | UI feels janky | Manual review pass during Phase 4 of frontend-first skill; document gotchas |
| Markdown table rendering in chat bubbles needs `remark-gfm` | Tables show as raw `\| header \| ... \|` | Explicit in tech stack; component tests cover this |
| Supabase JWT integration via starter kit may not match wrapper expectations | Phase 2 wiring fails | Phase 1 mocks the wrapper entirely; Phase 2 problem |
| Streamlit's auto-scroll, chat_input bottom-anchoring is hard to mimic | UX regression | Use Shadcn ScrollArea + sticky positioning; document if it falls short |

---

## 13. Phase Transitions (After Phase 1)

| Phase | Owner | What it does |
|---|---|---|
| Phase 1 | Factory + Stark approval gates | Build mocked Next.js frontend |
| Phase 2 | Stark (manual) | Swap mocks for real wrapper + Supabase + GCS calls |
| Phase 3 | Stark (manual) | Optionally replace wrapper middleware with Next.js API routes |
| Phase 4 | Stark (manual) | Production deploy to Cloud Run with HIPAA-equivalent posture (if needed) |

**Only Phase 1 is Factory work.** Phases 2–4 are Stark Skills territory.

---

## 14. Changelog

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-05-23 | Initial brief authored from Brain Drain extraction of `google-adk-n8n-hybrid-streamlit-v2` |
