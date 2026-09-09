# CLAUDE.md — Cyberize Agentic Automation (Project Spine)

> **Read this file FIRST on every session.**
> This is the project's contract with Claudy.
> Source-of-truth artifacts referenced here are loaded on demand.

---

## Project Identity

**Name:** Cyberize Agentic Automation — Next.js Frontend v1
**Origin:** Conversion of Streamlit app `google-adk-n8n-hybrid-streamlit-v2`
**Phase:** Frontend-First (Phase 1)
**Goal:** Faithfully port the existing Streamlit chat + admin app to Next.js + Shadcn + Tailwind, with mock data behind a service layer, ready for backend swap in Phase 2.

---

## 🚨 Mobile-First (NON-NEGOTIABLE — TOP RULE)

**Every UI task in this project is mobile-first or it gets an F.**

Mobile responsiveness is a **phase-gate failure** if absent. Not polish, not "later," not "Phase 7 cleanup." It's built into the component as it's authored. No exceptions.

**Required behavior at every phase-completion gate:**

- [ ] Design sketched at 375px FIRST, then expanded to desktop
- [ ] Sidebars become slide-over Sheet drawers via hamburger trigger at `<md` (768px)
- [ ] Touch targets ≥ 44px (`min-h-11 min-w-11` for interactive elements)
- [ ] Layouts stack vertically on mobile (`flex-col md:flex-row` pattern)
- [ ] Fluid typography (`text-2xl md:text-3xl`)
- [ ] Verified at 375 / 768 / 1024 in Chrome DevTools device toolbar

**Why it's at the top:** Run 001 Phase 5 shipped a desktop-only chat (`w-64 sidebar`, no media queries) despite UI_SPEC §2.3 specifying three breakpoints. That was a failure. This rule prevents recurrence.

See `agent_docs/STARTER_KIT_FEEDBACK.md` Lesson 6 for the cross-project generalization and `memory/feedback_mobile_first_non_negotiable.md` for cross-session recall.

---

## 🟥 Forbidden Zones (HARD GATES)

These are absolute. If you find yourself about to do any of these, STOP and surface to Stark.

- ❌ **No backend code authoring.** No API routes in `/app/api/` beyond the starter kit's auth callback.
- ❌ **No real wrapper calls.** All `/run_agent` and `/get_history` are mocked.
- ❌ **No real Supabase calls except auth.** Profile read/write is mocked.
- ❌ **No real GCS calls.** Instruction read/write is mocked.
- ❌ **No new features** not present in the original Streamlit app.
- ❌ **No "improvements"** to the original's behavior (the agent list drift, the lack of stale-session purge, the absence of server-side logout — preserve all of it).
- ❌ **No streaming.** Original is request-response.
- ❌ **No production deployment.** Phase 1 ends at `npm run build` succeeding + staging deploy URL.
- ❌ **No tests beyond component-level confidence.** No E2E suite in Phase 1.
- ❌ **No security hardening** beyond starter kit defaults. (Stark Skills territory.)

---

## 🟢 What You ARE Building

- Three screens: Login, Chat, Mission Control
- Service layer with mock data (the sole backend swap point)
- TypeScript types matching `DATA_CONTRACT.md` exactly
- Shadcn primitives + Tailwind styles + Zustand state
- Markdown rendering with `react-markdown` + `remark-gfm` (tables matter)
- Mobile responsive at 3 breakpoints
- Real Supabase auth via starter kit (auth is the ONE real integration)

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 — **App Router only** |
| Language | TypeScript (no `any`) |
| Styling | Tailwind CSS + Shadcn primitives |
| State | Zustand (app), useState (local) |
| Markdown | `react-markdown` + `remark-gfm` |
| Code highlighting | `react-syntax-highlighter` |
| Auth | Supabase (via starter kit) |
| Icons | `lucide-react` |
| Toasts | Shadcn `sonner` |
| HTML rendering | `html-react-parser` (NEVER `dangerouslySetInnerHTML`) |
| Testing | Vitest (component-level) |

---

## Project Structure (Expected)

```
/src/
├── app/
│   ├── layout.tsx               ← root AppShell
│   ├── page.tsx                 ← redirects to /login or /chat
│   ├── login/page.tsx
│   ├── chat/page.tsx
│   └── mission-control/page.tsx
├── components/
│   ├── layout/                  ← AppShell, Sidebar, GradientStrip
│   ├── auth/                    ← LoginForm, GatekeeperAlert
│   ├── chat/                    ← MessageList, ChatInput, AgentSelector, etc.
│   ├── mission-control/         ← AgentInstructionBlock, SaveButton
│   └── ui/                      ← Shadcn-generated primitives
├── services/                    ← ★ SOLE SWAP POINT ★
│   ├── authService.ts           (real — uses starter kit Supabase)
│   ├── chatService.ts           (mocked in Phase 1)
│   ├── profileService.ts        (mocked in Phase 1)
│   └── instructionsService.ts   (mocked in Phase 1)
├── stores/                      ← Zustand stores
│   └── chatStore.ts
├── types/                       ← all interfaces from DATA_CONTRACT
│   └── index.ts
├── mocks/                       ← deletable in one commit
│   ├── data/
│   │   ├── messages.ts
│   │   ├── instructions.ts
│   │   └── profiles.ts
│   └── responses.ts             ← mock response generators
└── lib/
    ├── supabase.ts              ← starter kit auth client
    └── utils.ts                 ← Shadcn `cn()` helper
```

---

## Source of Truth (Reading Order)

When you need to make a decision, consult these in this order:

1. **`APP_BRIEF.md`** — what we're building, scope locks, success criteria
2. **`DATA_CONTRACT.md`** — every data shape, type-level truth
3. **`UI_SPEC.md`** — screen-by-screen behavior
4. **This file (`CLAUDE.md`)** — operating rules
5. **`_extraction/*.md`** — Brain Drain extraction (raw evidence, on-demand)

**Conflict resolution:**
- `DATA_CONTRACT.md` wins on data shapes
- `UI_SPEC.md` wins on UI behavior
- `APP_BRIEF.md` wins on scope
- If two factory docs conflict, STOP and surface — do not silently resolve

---

## 🎨 Design Freedom + LOCKED PALETTE (Operator Override — 2026-05-28; palette ratified 2026-05-29)

UI_SPEC's visual prescriptions (§3 login layout, §4-§5 screen layouts, §2.1 rainbow gradient, emoji-prefixed titles) are **operator-overridden**. Functional behavior in UI_SPEC remains binding — auth flow, agent dropdown options, error states, save flow, all data transitions. Visual design follows the locked palette below.

### Locked Palette (use these classes — don't reinvent)

| Token | Light | Dark | Where it's used |
|---|---|---|---|
| Main bg | `bg-white` | `dark:bg-zinc-700` | Page wrappers, AppShellPage main, root body |
| Sidebar / rail | `bg-zinc-50` | `dark:bg-zinc-800` | All sidebars, drawers |
| Card / pill / popover | `bg-zinc-50` | `dark:bg-zinc-800` | Cards, tiles, ChatInput pill, dropdown menus, instruction blocks |
| Subtle raised | `bg-zinc-100` | `dark:bg-zinc-600` | User message pills, inline code, table-head |
| Border (visible) | `border-zinc-200` | `dark:border-zinc-600` | All borders that need to read in dark mode |
| Text primary | `text-zinc-900` | `dark:text-zinc-100` | Body, headings |
| Text muted | `text-zinc-500` | `dark:text-zinc-400` | Labels, captions, secondary |
| Primary button | `bg-zinc-900 text-white hover:bg-zinc-800` | `dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200` | All primary CTAs (ChatGPT-inverted) |
| Hover surface | `hover:bg-zinc-100` | `dark:hover:bg-zinc-600/60` | All hover affordances |
| Focus ring | `focus:ring-zinc-900` | `dark:focus:ring-zinc-100` | Inputs |
| Destructive | `bg-red-50 text-red-700 border-red-200` | `dark:bg-red-950/40 dark:text-red-300 dark:border-red-900` | Inline error banners |
| Success indicator | `bg-emerald-50 text-emerald-700 border-emerald-200` | `dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900` | Status pills |

**Default theme:** dark (`defaultTheme="dark"` in root layout).

**Note:** Sidebar is DARKER than main in dark mode (`zinc-800` darker than `zinc-700`) — ChatGPT-inverted pattern. User pill is LIGHTER than main (`zinc-600` on `zinc-700` bg).

### Other locked direction

- **ChatGPT-style aesthetic** — minimal, clean, professional SaaS feel
- **Inter font** (kit default — keep)
- Generous whitespace; tight letter-spacing on headings (`tracking-tight`); weight ramp 600 → 500 → 400
- Subtle micro-interactions only — focus rings, button hover, smooth transitions
- No rainbow gradient strip; no emoji-prefixed Streamlit-style titles
- Wordmark: **CYBERIZE** (small uppercase, tracked) above a confident heading
- Use Tailwind `dark:` variants throughout (never shadcn CSS variables — per kit convention)
- Theme toggle: `src/components/global/ThemeToggle.tsx` (clean sun/moon, distinct from the kit's dropdown ThemeToggler)

When building UI under this project, **consult the palette table FIRST**. If a kit primitive (Shadcn Card etc.) uses CSS variables that don't resolve, override className with explicit Tailwind classes from the table. Surface any palette divergence to the operator BEFORE shipping — palette decisions are doctrine-level.

See `agent_docs/STARTER_KIT_FEEDBACK.md` Lesson 4 for the cross-project generalization, and `memory/feedback_design_freedom_chatgpt_style.md` for cross-session recall (it has the full table too).

---

## 📐 Page Composition (Kit Convention — NON-NEGOTIABLE)

**Before building any new page, open `src/app/(public)/demo/` and read `DemoPageContent.tsx`.** That's the canonical example. The UI-UX-BUILDING-MANUAL.md §Page Building Pattern (line 412+) documents the rules.

**File location rule:**

- `page.tsx` is a thin wrapper (3-8 lines) that imports and returns a co-located `<Feature>PageContent.tsx`
- `<Feature>PageContent.tsx` lives **IN THE SAME FOLDER as `page.tsx`**, NOT in `src/components/`
- Page-specific subcomponents (used only by that route) also co-locate
- `src/components/{feature}/` is reserved for **shared cross-page** components

**Layout primitive decision tree:**

```
Is this a full-bleed app surface (sidebar + scrolling main / sticky input)?
  YES → AppShellPage from src/components/common/
        (chat, mission control, dashboards, ops consoles)
  NO  → Is this content-flow (marketing, doc, list, form)?
          YES → Page + Row + Box from src/components/common/
                (home, demo, settings forms, marketing)
          NO  → Is it a dense data table portal?
                  YES → plain <div className="container mx-auto p-6">
                        (admin-portal precedent)
```

**Kit's common primitives** (`src/components/common/`):
- `Page` — content-flow wrapper, responsive `w-11/12 mx-auto`
- `Row` — full-width section with `p-5`
- `Box` — bare content block
- `Container` — like Page, for nested sections
- `Main` — `<main>` element with `flex-grow`
- `AppShellPage` — **full-bleed app surface** with sidebar + main (born Phase 5.4 of this run; mobile-responsive built-in)

**Mistake to NOT repeat:** Phase 5 chat shipped with `ChatPageContent.tsx` in `src/components/chat/` (wrong location) and built without any common primitives (wrong patterns). Fixed in Phase 5.4. See `agent_docs/STARTER_KIT_FEEDBACK.md` Lesson 7 + `memory/feedback_kit_page_composition.md`.

---

## Skills Loaded for This Project

Auto-loaded via `.claude/skills/`:

- **`stark-frontend-first`** (mandatory — declares this phase) — service layer doctrine, mock conventions, anti-patterns
- *(Future: `stark-nextjs-shadcn-conventions`, `stark-tdd-flow` — not yet compiled)*

These skills enforce: service layer as sole swap point, types-first discipline, mock data conventions, Plan Mode discipline, no backend code authoring.

---

## Operating Rules (Inherited from Stark Global CLAUDE.md)

### Plan Mode (NON-NEGOTIABLE)

Before ANY file creation, modification, or refactor:

1. Enter Plan Mode (announce: `🔵 ENTERING PLAN MODE`)
2. Write plan to session file as `PENDING_APPROVAL`
3. Present plan in CLI with: Steps, Files to modify, Files to create, Files NOT touched, Assumptions, Risks
4. Wait for Stark's approval (`approved`, `go`, `do it`)
5. Execute exactly what was approved — nothing more, nothing less
6. Report completion with: Changes made, Things NOT touched, Concerns, Tests to run

### Karpathy Protocol

> **You are the hands. Stark is the architect.**

Move fast, but never faster than Stark can verify. Surface assumptions. Push back when warranted. Don't be sycophantic.

### Eyesight-Aware Communication

- **Explanations BEFORE code blocks.** Always. Stark uses audio playback during eye rest.
- No surprises. No code dumps. No bullet-list explanations *after* code.

### Surgical Changes

Touch only what you must. Don't refactor adjacent code. Don't "improve" working code. Don't remove comments you don't understand.

### Surface Conflicts, Don't Average

When two patterns or sources contradict, pick one (more recent / more tested), explain why, flag the other. Don't blend.

### Code Over Model When Deterministic

If a routing decision, transform, or check can be done in code, use code. Don't reach for LLM judgment for deterministic operations.

### Fail Loud

"Completed" means actually completed. "Tests pass" means actually pass. If you skipped something, say so explicitly.

### Token Budget Discipline

- Per task: ~4000 tokens
- Per session: ~30000 tokens
- If approaching budget, summarize and propose a fresh session

---

## TDD Flow (Stark Standard)

For every component or service:

```
Build → Unit Test → Integrate → Block Test → System Test → Finalize
```

Do not skip steps. Do not move to the next step until the current passes. For Phase 1, "tests" can be Vitest component tests + manual visual verification — full E2E is out of scope.

---

## Project-Specific Conventions

### File Naming
- Components: PascalCase (`LoginForm.tsx`)
- Services: camelCase (`authService.ts`)
- Types: PascalCase interfaces inside `types/index.ts`
- Mocks: lowercase plural (`messages.ts`)

### Service Layer Discipline
- All external data access through `/src/services/`
- Components NEVER import from `/src/mocks/` directly
- Components NEVER import Supabase clients directly (auth flows through `authService`)
- Each service has BACKEND_SWAP_NOTES indicating Phase 2 wiring

### State Management
- Zustand for cross-component state (`chatStore`)
- `useState` for local UI state (form inputs, dropdown open/closed)
- Server components by default; `'use client'` only when needed

### Markdown Rendering (CRITICAL)
- Assistant message bubbles MUST render markdown including GFM tables
- Use `react-markdown` + `remark-gfm`
- The `ghl_mcp_agent` contacts table in screenshot 3 is the canonical test case
- Code blocks get syntax highlighting

### Naming Conventions for Wire Shapes
- Wire-format types (request/response to/from wrapper): snake_case fields (`agent_name`, `session_id`, `user_id`)
- UI-internal types: camelCase (`AgentSessionMap`, `selectedAgent`)

---

## Approval Gates

Phase 1 has explicit approval checkpoints. Do not skip ahead without Stark's sign-off.

1. **Types & Contract built** → Stark reviews types match `DATA_CONTRACT.md`
2. **Service layer scaffolded** → Stark reviews method signatures
3. **Mock data populated** → Stark reviews realism
4. **Login screen built** → Stark verifies real Supabase auth works
5. **Chat screen built** → Stark verifies dropdown, message flow, markdown table rendering
6. **Mission Control built** → Stark verifies save flow, gatekeeper behavior
7. **Verification pass** → Stark walks through all screens, signs off, then npm build

---

## Disaster Recovery

Keep `RECOVERY.md` at project root. Update after every plan completion.

```markdown
# Recovery State
Last action: [what was just completed]
Pending: [NONE | what's waiting for approval]
Next step: [what comes next]
```

If terminal crashes, session file + `RECOVERY.md` = 3-second context restore.

Session log lives at `session_YYYY-MM-DD.md` (matches global CLAUDE.md convention).

---

## Known Discrepancies (Preserve, Don't Fix)

From the original Streamlit app, intentionally preserved in this conversion:

1. Mission Control hardcodes 4 agents; Chat dropdown has 5 (`ghl_mcp_agent` omitted from Mission Control)
2. No stale-session purge logic (the commented-out block in original)
3. No server-side logout (`auth.signOut()` not called)
4. No client-side validation on login form
5. Empty chat state has no "Welcome" text

These are tracked for Phase 2 to revisit.

---

## Phase Transitions

| Phase | Owner | Scope |
|---|---|---|
| **Phase 1** (current) | Factory + Stark approval gates | Mocked Next.js frontend, staging-deployable |
| **Phase 2** | Stark (manual) | Real wrapper + Supabase + GCS swaps |
| **Phase 3** | Stark (manual) | Optional: replace wrapper with Next.js API routes |
| **Phase 4** | Stark (manual) | Production deploy |

**Phase 1 is Factory work. Phases 2-4 are Stark Skills.** Do not blur this line.

---

## On Completion

When Phase 1 success criteria from `APP_BRIEF.md` are met:

1. Update `RECOVERY.md` with final state
2. Author `BACKEND_SWAP_NOTES.md` at project root listing each service method's Phase 2 wiring requirements
3. Run `npm run build` — must succeed
4. Tag the commit (e.g., `phase-1-complete`)
5. Tell Stark: project is ready for Phase 2 handoff

---

## Version

| Version | Date | Notes |
|---|---|---|
| 1.0 | 2026-05-23 | Initial project spine for Cyberize Agentic Automation conversion |

---

*Part of the Stark Industries AI App Factory — Run 001 of the Frontend Conversion Pipeline.*
