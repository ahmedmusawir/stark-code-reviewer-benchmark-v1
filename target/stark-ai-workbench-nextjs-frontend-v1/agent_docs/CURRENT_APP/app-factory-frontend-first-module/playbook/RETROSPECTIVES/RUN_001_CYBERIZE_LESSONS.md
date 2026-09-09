# Run 001 Retrospective — Cyberize Agentic Automation Conversion

> **What worked, what was corrected, what should change in the Factory for Run 002+.**
>
> Source app: `google-adk-n8n-hybrid-streamlit-v2` (Streamlit).
> Target: `adk-agent-harness-nextjs-frontend-v1` (Next.js + Shadcn + Tailwind + Zustand).
> Operator: Tony Stark (Moose).
> Agent: Claudy.
> Dates: 2026-05-27 → 2026-05-29 (3 calendar days, ~6-8 active hours of agent work + operator review).
> Phases delivered: 0 (Discovery) through 8 (this retrospective). All frontend-first work; backend swap = overall-lifecycle Phase 2, separate run.

---

## TL;DR

Run 001 succeeded. The cyberize frontend is built, mobile-first, dark-default, ChatGPT-style. All 121 tests pass; `npm run build` is clean; the four service methods are mocked behind a swap-clean interface; backend swap notes are documented at the project root. The Factory module survived its first real conversion run with 8 captured lessons that should propagate upstream.

The biggest cost was unforced agent errors — five separate incidents where I broke a kit convention or skipped a project doctrine, each requiring corrective work. The biggest win was the operator catching these early and forcing the lessons into writing before each correction.

---

## What worked

1. **Plan Mode + supervised autonomy.** Every phase boundary had an explicit plan + operator approval gate. When I drifted (and I drifted often), the operator caught it inside the gate before it cascaded into code. This is the Karpathy Protocol working as designed.

2. **The kit's existing auth + RBAC.** Stark SaaS Starter v0.4.1 saved an estimated 1-2 days. Three working portals, real Supabase wiring, three Supabase clients, `protectPage` guards, DB triggers — all of it production-quality. Lesson 2 (don't wrap kit auth in a service) preserved this value.

3. **Lessons-as-doctrine pattern.** Every mistake got captured into three places (project doctrine, kit feedback, memory) BEFORE the next phase started. By Phase 7 the doctrine was thick enough that the agent (me) was self-correcting without operator intervention. This is the evolution principle from the module CLAUDE.md actually working.

4. **AppShellPage as a born-mid-run primitive.** Phase 5.4 needed a full-bleed app surface; the kit's `Page + Row + Box` content-flow primitives didn't fit. Instead of forking or hacking around, we authored `AppShellPage` with heavy JSDoc + a decision tree. It validated across `/chat` (Phase 5) and `/mission-control` (Phase 7) — two consumers — and is ready for upstream promotion.

5. **Mobile-first as Rule Zero.** Once captured (Phase 5/6 boundary), it shaped every subsequent component. The hamburger-drawer pattern in AppShellPage, the `min-h-11` touch targets, the `px-3 md:px-6` fluid padding — all flowed naturally because the rule was at the top of every doctrine doc.

6. **Locked palette table.** After Phase 5.5 dark-mode iteration ("too black" → softer zinc-700/800/600), the final palette got captured as an 11-token table in `_project/CLAUDE.md`. Phase 7 Mission Control used it without any palette discussion needed. This is the kind of doctrine that compounds.

---

## What went wrong (captured as Lessons)

### Lesson 1 — Framework conventions: code-on-disk + framework docs > stale kit docs

**Phase:** 0.5

**What happened:** I read `STARTER_PROJECT_OVERVIEW.md` line 26 saying `src/middleware.ts`. The kit had `src/proxy.ts`. I diagnosed this as a misnaming bug and proposed renaming. Operator (probably reluctantly) approved. Halfway through, `npm run build` output told me Next.js 16 renamed the convention — the kit was right; the doc was stale.

**Cost:** ~15 minutes of rename + revert + rewriting the kit feedback note.

**Captured in:** `STARTER_KIT_FEEDBACK.md` Lesson 1 + memory + `STARTER_PROJECT_OVERVIEW.md` Agent Working Rule #11.

**Promotion proposal for upstream:** Update kit's `STARTER_PROJECT_OVERVIEW.md` line 26 to reference `src/proxy.ts` for Next.js 16+, with a parenthetical noting the rename.

---

### Lesson 2 — Don't wrap kit's auth in a redundant service

**Phase:** 2

**What happened:** DATA_CONTRACT §2.1 prescribed an `authService` with `signIn/signOut/getCurrentUser`. I drafted a Phase 2 plan to author it as a wrapper around the kit's already-complete auth stack. Operator stopped me at Plan Mode: "kit's auth is the auth — components consume primitives directly."

**Cost:** ~30 minutes of plan rework, no code written yet (caught at the gate).

**Captured in:** Lesson 2 + memory + Agent Working Rule #12 + the project CLAUDE.md.

**Promotion proposal:** Update the Factory module's DATA_CONTRACT template to note "if the kit provides auth as wired infrastructure, do NOT author authService — components consume kit primitives directly."

---

### Lesson 3 — Component tests need `@jest-environment jsdom` + `@testing-library/jest-dom`

**Phase:** 4

**What happened:** Authored `LoginForm.test.tsx` without the jsdom docblock. Suite failed with `Cannot read properties of undefined (reading 'navigator')` at `@testing-library/user-event`'s clipboard setup. Other kit tests already follow the convention; I missed it.

**Cost:** ~10 minutes of debugging + fix.

**Captured in:** Lesson 3 + memory.

**Promotion proposal:** Add a `.test.tsx` template to the kit baseline with the docblock + jest-dom import pre-included. Or migrate to `@next/jest` preset which handles environment automatically.

---

### Lesson 4 — Capture design-freedom overrides in writing BEFORE coding visuals

**Phase:** 4.5

**What happened:** Phase 4 built the login faithful to UI_SPEC §3 — emoji-prefixed "⚡ Mission Control Login" heading, NavbarLoginReg, "Authenticate" button. Operator hated it ("ugly", "Streamlit-y") and gave explicit design freedom ("go crazy", "make it look pro", "ChatGPT-like"). UI_SPEC's "faithful conversion" rule was operator-overridden for visuals.

**Cost:** ~30 minutes of doctrine capture + redesigning the login.

**Captured in:** Lesson 4 + memory + project CLAUDE.md "Design Freedom" section + locked palette table.

**Promotion proposal:** Add to the Factory module's frontend-first skill: "When operator gives design freedom OR expresses dissatisfaction with a faithfully-built screen, capture the override in `_project/CLAUDE.md` BEFORE any redesign work. Distinguish functional UI_SPEC from visual UI_SPEC."

---

### Lesson 5 — Adding modern UI deps needs Jest config patches (ESM + jsdom polyfills)

**Phase:** 5

**What happened:** `react-markdown` v10 is ESM-only. The kit's `jest.config.js` only transforms `.ts/.tsx` and excludes all of `node_modules`. Tests blew up with `SyntaxError: Unexpected token 'export'`. Then `scrollIntoView` (called by MessageList auto-scroll) blew up because jsdom doesn't implement it. Three iterations of allowlist additions + a polyfill in `jest.setup.ts` to clear.

**Cost:** ~30 minutes of iterating the allowlist + polyfill.

**Captured in:** Lesson 5 + memory.

**Promotion proposal:** Migrate kit's `jest.config.js` to `@next/jest` preset which handles ESM + path aliases + browser polyfills out of the box. Alternative: ship the comprehensive allowlist + scrollIntoView polyfill in the kit baseline.

---

### Lesson 6 — Mobile-first is non-negotiable for every UI task (Rule Zero)

**Phase:** 5.5

**What happened:** Phase 5 shipped a desktop-only chat. `w-64 sidebar`, no media queries, no slide-over. Despite UI_SPEC §2.3 explicitly specifying 375/768/1024 breakpoints. Operator flagged it as failing-grade work and demanded doctrine update: *"Any UI/UX design gets an F if it's not mobile responsive."*

**Cost:** ~10 minutes of doctrine writing; the actual mobile drawer was built as part of `AppShellPage` in Phase 5.4 anyway. The cost was the trust loss + having to elevate the rule above everything else in the doctrine.

**Captured in:** **Lesson 6 (top priority, marked 🚨)** + memory + project CLAUDE.md top section + Agent Working Rule #1.

**Promotion proposal:** Add a mobile-first checkbox to the kit's phase-completion-gate template. Ship a mobile screenshot harness in the kit (e.g., a Playwright script that auto-captures at 375/768/1024). Audit the three existing kit portals for mobile responsiveness in the next pristine-kit refresh.

---

### Lesson 7 — Kit page composition: co-locate `*PageContent.tsx` + use common primitives

**Phase:** 5.4

**What happened:** Phase 5 authored `ChatPageContent.tsx` in `src/components/chat/` instead of co-located with `src/app/(cyberize)/chat/page.tsx`. Also built chat with raw flex divs, ignoring `Page+Row+Box` and never reading `(public)/demo/` which is the canonical example. Operator: *"this is not a vibe coding joint. This is an Engineering Factory. We follow rules here."* The UI-UX-BUILDING-MANUAL.md §Page Building Pattern (line 412+) documents exactly the convention I missed.

**Cost:** ~45 minutes — file moves, AppShellPage authoring (Option B from operator), doctrine capture, test import updates.

**Captured in:** Lesson 7 + memory + project CLAUDE.md "📐 Page Composition" section + Agent Working Rule #13.

**Promotion proposal:**
- `AppShellPage` primitive (born this run, validated across 2 surfaces) ships in pristine kit `src/components/common/`.
- Reference `AppShellPage` in `UI-UX-BUILDING-MANUAL.md` §Page Building Pattern as a new sub-section.
- Module playbook files `06-CHAT.md` and `07-MISSION-CONTROL.md` reference it as the canonical wrapper for app-shell pages.

---

### Lesson 8 — Don't import server-only modules into client components, even transitively

**Phase:** 6 hotfix (morning after Phase 6 close)

**What happened:** I added `import { AppRole } from "@/utils/get-user-role"` to `CyberizeSidebar.tsx` (a `"use client"` component). `get-user-role.ts` also exports the server-only `getUserRole` that imports `next/headers`. Dev mode tolerated it; `npm run build` (Turbopack) correctly rejected: "You're importing a module that depends on 'next/headers'..."

**Cost:** ~5 minutes to extract `AppRole` to `src/utils/app-role.ts` (server-free), update re-export, update the import.

**Captured in:** Lesson 8 + memory.

**Promotion proposal:** Ship `app-role.ts` already extracted in the pristine kit. The current coupling of `AppRole` enum + `getUserRole` server function in one file is a trap for any new project that needs to use the enum from a client component.

---

## Lessons NOT promoted (project-specific, stay here)

- **Behavior-based testing when mock-vs-jsdom fights you.** In Phase 5.5 the Copy-button test went 4 iterations on clipboard mocking before I switched to asserting "button aria-label flips to 'Copied'". This is a real wisdom but feels generic enough to be everyone's first instinct — probably not worth a Lesson 9 unless it reappears.
- **Per-agent message retention via `Record<AgentName, Message[]>`.** Useful chat-app pattern but specific enough to this domain that it doesn't generalize.
- **System status indicator with pulsing dot.** Cyberize home page only.

---

## Process observations (no specific lesson, but worth noting)

1. **The operator's pace was generous with planning, impatient with bikeshedding.** Big plan-mode proposals got slow careful review; lots of small open-question "your call" prompts annoyed him. Future runs: pick defaults more aggressively and surface only the genuinely consequential decisions.

2. **`approved, propose next phase`** was the operator's most common phrase. Pre-baking the next phase's plan in the completion report saved real time.

3. **Late-night sessions accumulated unverified work.** Phase 5.5 + 6 closed at midnight without manual verification. The "verification checklist file Tony follows in the morning" pattern worked — but doing two phases unverified is a risk we got lucky with. Future runs: aim to verify within 12 hours of building, even if the operator does it asynchronously.

4. **Hotfixes happen.** The Phase 6 → morning build error was caught by `npm run build`, not by tests or tsc. **Add `npm run build` to the verification gate at every phase, not just the final one.** Lower-cost than discovering build breaks days later.

5. **Documentation overhead was real but worth it.** ~25-30% of agent time went into doctrine/memory/feedback writing. That's high for a single project but the compound interest is real — Phase 7 was the smoothest phase, because by then the doctrine was already covering the decisions. Future runs should hit this equilibrium sooner.

---

## Structural changes proposed for Factory Run 002+

| Change | Where | Why |
|---|---|---|
| Mobile-first checkbox at every phase-completion gate | `playbook/00-OVERVIEW.md` Universal Phase Discipline | Lesson 6 — currently easy to forget if not in the gate |
| `npm run build` at every phase-completion gate | Same | Process observation 4 — catches client/server boundary issues tsc misses |
| `AppShellPage` referenced as a primitive | `UI-UX-BUILDING-MANUAL.md` + kit baseline | Lesson 7 promotion |
| `app-role.ts` shipped separately from `get-user-role.ts` | Kit baseline | Lesson 8 — easy trap to avoid by default |
| `.env.example` shipped at kit root | Kit baseline | Already in STARTER_KIT_FEEDBACK priority #1 |
| `tsconfig.json` excludes `agent_docs/**` | Kit baseline | Already in feedback |
| Jest config: migrate to `@next/jest` preset | Kit baseline | Lessons 3 + 5 both resolved by this |
| Locked palette table shipped as kit's default dark mode | Kit baseline | Aesthetic decision but standardizes the first impression |
| Pristine kit clone workflow | Kit baseline + process doc | STARTER_KIT_FEEDBACK priority #2 — eliminates the QR-residue problem we hit at start of Run 001 |

These are all already documented in `agent_docs/STARTER_KIT_FEEDBACK.md` priority order. Operator owns the upstream kit baseline; this retrospective just confirms what's worth promoting after one real run.

---

## Numbers

| Metric | Value |
|---|---|
| Calendar days | 3 (2026-05-27 → 2026-05-29) |
| Active agent hours | ~6-8 |
| Phases completed | Phase 0 through Phase 8 (this doc) — full frontend-first lifecycle |
| Tests at end | 121 passing across 20 suites |
| Files created (excluding kit) | ~30 |
| Files modified (kit + project) | ~25 |
| Lessons captured | 8 (Lessons 1-8 in `STARTER_KIT_FEEDBACK.md`) |
| Operator-corrected mistakes | 5 (proxy.ts misdiagnosis, authService over-engineering, mobile-first miss, page composition violation, dark-too-black) |
| Build failures discovered late | 1 (Phase 6 → morning hotfix, server-only imports) |
| Approval gates honored | All — no operator-objected execution |

---

## Closing

Run 001 forged the Factory module. The cyberize frontend ships. Lessons 6, 7, 8 — and the AppShellPage primitive — propagate upstream when the operator next refreshes the pristine kit baseline.

Run 002 should be sharper. The doctrine is tighter, the kit feedback list is concrete, and the page composition + mobile-first rules are now Rule Zero territory.

🥄 *Part of Stark Industries — AI App Factory.*
