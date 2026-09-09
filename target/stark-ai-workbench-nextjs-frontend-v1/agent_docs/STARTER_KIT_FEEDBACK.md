# Starter Kit Feedback

> Findings discovered while bootstrapping a new project on top of Stark SaaS Starter v0.4.1.
> Each entry is something to consider fixing at the **kit baseline** so future projects don't repeat the work.
> Written during Cyberize Agentic Automation conversion (Run 001), 2026-05-27.

---

## 🧠 Agent Lessons (Read Before Starting Work)

> These are behavioral rules learned from real mistakes during Factory runs. Read them BEFORE Phase 0 Discovery. They save time and trust.

### Lesson 1 — Framework conventions: code-on-disk + framework docs > stale kit docs

**Rule:** When the kit's documentation references a framework file/function name that doesn't match the on-disk code, check the framework's current docs FIRST. Don't diagnose it as a misnaming bug.

**Why (Run 001):** I read `STARTER_PROJECT_OVERVIEW.md` line 26 saying `src/middleware.ts`, found `src/proxy.ts` on disk, and proposed renaming as a "critical bug." Wrong — Next.js 16 renamed the convention (`middleware` → `proxy`). The kit was correct; the doc was stale relative to the kit's actual Next.js 16 baseline. Had to revert mid-Phase-0.5 and rewrite the feedback note.

**How to apply:** For ANY doc-vs-code discrepancy involving framework conventions (file names, export names, folder structures), open the framework's official docs for the in-use version before declaring a bug or proposing a rename. Kit overview docs can lag the actual baseline by a major framework version.

---

### Lesson 2 — The kit's auth is complete; don't wrap it in a service

**Rule:** Do NOT author `src/services/authService.ts` as a wrapper around the kit's existing auth stack. UI components consume the kit's auth primitives directly: `useAuthStore`, `src/utils/supabase/client.ts`, `/api/auth/*` routes, `protectPage` guard.

**Why (Run 001):** The Factory module's DATA_CONTRACT §2.1 prescribed an `authService` with `signIn/signOut/getCurrentUser`. I drafted a Phase 2 plan to author it as a wrapper. Tony pushed back as I was about to write the file — the kit already has complete tested auth (Supabase SSR + RBAC + RLS + DB trigger + three working portals). A service wrapper would be pure indirection without abstraction value. The DATA_CONTRACT spec was generic; it didn't know how complete the kit's auth would be.

**How to apply:** Before authoring any service the DATA_CONTRACT prescribes — especially auth-adjacent — check what the kit already provides as wired infrastructure. If the kit provides it: components consume the kit's primitives directly. Service layer is reserved for what the kit does NOT provide (chat, agent profiles, agent instructions, domain operations). On this kit, treat DATA_CONTRACT §2.1 (`authService`) as satisfied by kit infrastructure.

---

### Lesson 3 — Component tests need `@jest-environment jsdom` + `@testing-library/jest-dom`

**Rule:** Every `.test.tsx` file that renders a React component MUST start with the `@jest-environment jsdom` docblock as its first comment, then `import "@testing-library/jest-dom"` before any other testing-library imports. The kit's `jest.config.js` defaults `testEnvironment` to `node` globally.

**Why (Run 001):** In Phase 4, I authored `LoginForm.test.tsx` without the docblock. Suite failed with `Cannot read properties of undefined (reading 'navigator')` at `@testing-library/user-event`'s clipboard module setup — that module needs `window.navigator`, which doesn't exist in the node env. Other kit component tests already follow this convention (see `src/__tests__/admin/AddMemberForm.test.tsx`); I missed it because the convention isn't documented elsewhere.

**How to apply:** Boilerplate at the top of every component test:

```typescript
/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
```

Pure-function tests (`.test.ts`) — server actions, utilities, no React rendering — keep the default node env. No docblock needed for those.

---

### Lesson 4 — Capture design-freedom overrides in writing BEFORE coding visuals

**Rule:** When the operator gives explicit design freedom or overrides UI_SPEC's visual prescriptions, capture the override in `_project/CLAUDE.md` + memory BEFORE coding the next visual screen. Otherwise the next session re-litigates from UI_SPEC.

**Why (Run 001):** In Phase 4, I built the login faithful to UI_SPEC §3 — centered card, "⚡ Mission Control Login" emoji heading, "Authenticate" button, `NavbarLoginReg` above. Operator hated it: *"i don't like you to mimic the streamlit app's look and feel... go crazy... make it look pro... ChatGPT-like... SAAS feeling."* UI_SPEC's "faithful conversion" rule was operator-overridden for visuals. Without capturing the override in writing, the next session could drift back to UI_SPEC §3-§5 visuals.

**How to apply:** When the operator says "go crazy", "make it look pro", "design freedom", "you decide", "surprise me", or expresses dissatisfaction with a faithfully-built screen — STOP, capture the override:

1. **`_project/CLAUDE.md`** — add a "Design Freedom" section recording the direction (palette, typography, layout pattern, what "good" looks like in their words)
2. **Memory** (feedback type) — for automatic cross-session recall
3. **Distinguish what's overridden vs not** — usually only visuals; functional behavior from UI_SPEC (auth flow, data shapes, state transitions, error semantics) often still binds. Surface this distinction explicitly so it's not lost.

Then execute against the captured direction. Surface — don't drift silently back to UI_SPEC visuals.

---

### 🚨 Lesson 6 — Mobile-first is non-negotiable for every UI task (TOP PRIORITY LESSON)

**Rule:** Every UI task — component, layout, page, polish — is mobile-first or it gets an F. Mobile responsiveness is a **phase-gate failure** if absent. Not polish, not "later." It is built into the component AS IT IS AUTHORED.

**Why (Run 001):** Phase 5 chat was built desktop-only — `w-64 sidebar`, no media queries, no slide-over — despite UI_SPEC §2.3 explicitly specifying 375 / 768 / 1024 breakpoints. Operator (27-year IT veteran, ex-AT&T enterprise) flagged it as failing-grade work and demanded doctrine update. Quote: *"Any UI/UX design gets an F if it's not mobile responsive."*

**How to apply at every phase:**

1. **Sketch the 375px experience FIRST**, then expand to desktop. Mobile is the constraint.
2. **Sidebars → Sheet/Drawer slide-overs at `<md` (768px)**. Hamburger trigger in top bar. Use Shadcn `Sheet` primitive.
3. **Touch targets ≥ 44px** (`min-h-11 min-w-11`). Never `w-6 h-6` for an interactive element.
4. **Flex/grid stacks vertically on mobile** (`flex-col md:flex-row`).
5. **Fluid typography + spacing** (`text-2xl md:text-3xl`, `px-3 md:px-6`).
6. **Verify at 3 breakpoints in Chrome DevTools device toolbar**: 375 (iPhone SE), 768 (iPad portrait), 1024 (iPad landscape).
7. **At the phase-completion verification gate, mobile responsiveness is a CHECKBOX** — not optional. If it's not checked, the phase is INCOMPLETE.

**Kit-level fix opportunity:** Add a mobile-first checklist to the kit's phase-completion-gate template. Ship a `MobileTestHarness` component or screenshot script in the kit that auto-captures at 3 breakpoints during `npm run verify`. The current kit ships with three role portals (admin/member/superadmin) — verify they're already mobile-responsive (haven't audited them yet this run); if not, kit-level patch needed.

---

### 📐 Lesson 7 — Kit page composition: co-locate `*PageContent.tsx` + use common primitives

**Rule:** Every new page follows the kit's documented composition pattern. Before building any page:

1. **Open `src/app/(public)/demo/DemoPageContent.tsx`** — canonical example. The UI-UX-BUILDING-MANUAL.md §Page Building Pattern (line 412+) documents the convention.
2. `page.tsx` is a thin wrapper (3-8 lines) that imports a **co-located** `<Feature>PageContent.tsx`.
3. `<Feature>PageContent.tsx` lives **IN THE SAME FOLDER as `page.tsx`**, NOT in `src/components/`.
4. Page-specific subcomponents also co-locate (see `(admin)/admin-portal/DeleteUserButton.tsx` as precedent).
5. `src/components/{feature}/` is for **shared cross-page** components only.

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
                        (admin-portal precedent — kit allows this)
```

**Common primitives** (already shipped in kit at `src/components/common/`):
- `Page` — responsive content-flow wrapper (`w-11/12 mx-auto` non-FULL, `min-w-full` FULL)
- `Row` — full-width section with `p-5` padding
- `Box` — bare content block
- `Container` — Page variant for nested sections
- `Main` — `<main>` semantic element with `flex-grow`
- **`AppShellPage`** — **NEW** (born this run, Phase 5.4). Full-bleed app surface with sidebar + main. Mobile-first built-in (sidebar collapses to hamburger-triggered slide-over at `<md`).

**Why (Run 001 Phase 5):** I authored `ChatPageContent.tsx` in `src/components/chat/` instead of co-locating with `src/app/(cyberize)/chat/page.tsx`. Also built chat with raw flex divs, ignoring the common primitives. Operator response: *"this is not a vibe coding joint. This is an Engineering Factory. We follow rules here."* Fixed in Phase 5.4: moved 4 files to co-location, authored `AppShellPage` primitive, captured this lesson.

**How to apply at every page-creation moment:**

Before opening a new file under `src/app/`, ask:
1. Will this page have a sidebar + main split? → use `AppShellPage` (write a thin route layout that wraps children in `<AppShellPage sidebar={...} mobileTitle="..." />`)
2. Will this page be content-flow (text, forms, marketing)? → use `<Page FULL={false}>` + `<Row>` + `<Box>`
3. Will this page be a dense table/list portal? → plain `<div className="container mx-auto p-6">`

In all cases:
- Create `page.tsx` as a 3-8 line wrapper
- Co-locate `<Feature>PageContent.tsx` and any page-specific subcomponents in the SAME folder
- Reusable cross-page components → `src/components/{feature}/`

**Kit-level promotion path:** If `AppShellPage` validates across:
- Phase 5 chat (Run 001 — first consumer, mobile-tested at 375/768/1024)
- Phase 6 home (Run 001 — TBD; may use Page+Row+Box instead)
- Phase 7 mission control (Run 001 — second consumer, confirms generalization)

Then at Phase 8 Retrospective, promote upstream to:
1. **`agent_docs/APP_FACTORY/UI-UX-BUILDING-MANUAL.md`** — new sub-section under §Page Building Pattern: "AppShellPage: full-bleed app surfaces" with usage examples and the decision tree
2. **The pristine starter kit baseline** — kit ships `src/components/common/AppShellPage.tsx` by default
3. **The module playbook** — `06-CHAT.md` and `07-MISSION-CONTROL.md` reference `AppShellPage` as the canonical wrapper for app-shell pages

If it fails or needs major rework → document the failure in the Phase 8 retrospective and revise the primitive's design before any upstream promotion. Don't promote unvalidated patterns.

---

### Lesson 8 — Don't import server-only modules into client components, even transitively

**Rule:** When a `"use client"` component imports a runtime VALUE (enum, const, function) from a module, the ENTIRE module gets bundled for the client. If that module has server-only imports (`next/headers`, `supabase/server`, server actions), they leak into the client bundle and **`next build` fails** (Turbopack catches this; dev mode is permissive). To cross the boundary safely, extract shared values to a module with ZERO server-only deps.

**Why (Run 001 Phase 6 hotfix, 2026-05-29):** I added `import { AppRole } from "@/utils/get-user-role"` to `CyberizeSidebar.tsx` (a `"use client"` component) for the admin-link visibility check. `get-user-role.ts` ALSO exports `getUserRole` which imports `next/headers` via `supabase/server`. Dev worked; production build failed:

```
You're importing a module that depends on "next/headers". This API is only
available in Server Components in the App Router, but you are using it in
the Pages Router.
Client Component Browser:
  ./src/utils/supabase/server.ts
  ./src/utils/get-user-role.ts
  ./src/components/layout/CyberizeSidebar.tsx
```

Fixed by extracting `AppRole` to `src/utils/app-role.ts` (server-free) and re-exporting from `get-user-role.ts` for backward compatibility.

**How to apply — before adding any import to a `"use client"` file:**

1. **`import type { Foo }`** — always safe; TypeScript erases at runtime.
2. **`import { Foo }`** (used as a runtime value — enum member, function call, comparison constant) — the WHOLE source module loads. Verify the source has no server-only imports.
3. **For shared values that need client + server use**, dedicate a module with zero server deps. Pattern: `src/utils/app-role.ts` (Phase 6).
4. **Symptom**: `npm run dev` works; `npm run build` fails with the message above. The "Import traces" in the error tell you which client component is the entry point.
5. **`import type` in `useAuthStore`** works for `AppRole` typing because TS erases it. Adding a value `import { AppRole }` to `useAuthStore` would break the build — same trap.

**Kit-level fix:** Ship `AppRole` already extracted in `src/utils/app-role.ts` by default. Update `get-user-role.ts` to re-export. Existing kit code keeps working; new client components can import the enum safely.

**Generalizable rule for any Next.js App Router project:** audit `utils/` for files that couple server-only logic with shared values. If found, split them.

---

### Lesson 5 — Adding modern UI deps needs Jest config patches (ESM + jsdom polyfills)

**Rule:** When adding a UI dependency that's ESM-only (e.g., `react-markdown` v10+) or uses browser-only APIs (`scrollIntoView`, `IntersectionObserver`, `ResizeObserver`, `matchMedia`), expect to patch BOTH:

1. **`jest.config.js`** — add `.js/.jsx/.mjs` to `transform`, expand `transformIgnorePatterns` allowlist for the ESM transitive chain
2. **`src/__tests__/jest.setup.ts`** — polyfill the missing browser API

The kit's default Jest config handles neither.

**Why (Run 001):** Phase 5 install of `react-markdown` v10 + `react-syntax-highlighter` broke 2 test suites with `SyntaxError: Unexpected token 'export'`. Then `MessageList`'s auto-scroll broke a third test with `TypeError: scrollIntoView is not a function` because jsdom doesn't implement it. Three fixes (transform regex, allowlist additions, polyfill) got all 17 suites green.

**How to apply:** Whenever installing a new UI lib:

1. Inspect the lib's `package.json` — `"type": "module"`? Only ESM exports? → needs allowlist entry
2. Search the lib's source/docs for browser-only APIs → polyfill needed
3. **Run tests immediately after install** — catches both issues before context bloats with later work

The current Phase 5 allowlist in `jest.config.js` covers the react-markdown + react-syntax-highlighter chain (~30 transitive ESM packages). The `scrollIntoView` polyfill lives in `jest.setup.ts` and is a no-op for tests.

**Kit-level fix opportunity:** Migrate the kit's `jest.config.js` to `@next/jest` preset (Next.js's blessed jest setup) which handles ESM + path aliases + browser-polyfill defaults out of the box. Alternative: ship a comprehensive default allowlist + the `scrollIntoView` polyfill in the kit baseline.

---

## 🟡 Doc Drift: `STARTER_PROJECT_OVERVIEW.md` Calls Middleware `middleware.ts`, But Next.js 16 Renamed It

**Symptom:** `STARTER_PROJECT_OVERVIEW.md` line 26 says: *"`src/middleware.ts` — calls `updateSession(request)` on every request"*. The actual file in the kit is `src/proxy.ts`. Reading the doc first, then the kit, I diagnosed this as a misnaming bug and proposed renaming `proxy.ts` → `middleware.ts`. **I was wrong.**

**What's actually going on:** Next.js 16 renamed the convention. Build output confirms:

```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
   Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
```

So `proxy.ts` is the **correct modern convention** for Next.js 16. The kit is right. The doc is stale relative to the kit's actual Next.js 16 baseline.

**Fix at kit source:**
- Update `STARTER_PROJECT_OVERVIEW.md` line 26 to reference `src/proxy.ts` (the function `proxy`) instead of `src/middleware.ts` (`middleware`).
- Add a one-line note that Next.js 16+ uses `proxy.ts`; pre-v16 used `middleware.ts`.

**Lesson recorded for the agent:** When a doc and the code diverge, read the framework docs before assuming the code is wrong. The kit is closer to source-of-truth than the overview doc when it comes to framework conventions.

---

## 🟡 `tsconfig.json` Doesn't Exclude `agent_docs/**`

**Symptom:** `npm run build` fails type-check because `agent_docs/CURRENT_APP/.../skills/stark-frontend-first/templates/mock-data.template.ts` has TODO-comment imports (`import type { /* TODO */ } from '@/types'`) that don't resolve. The build trips on them because the kit's tsconfig includes everything matching `**/*.ts` and only excludes `node_modules`.

**Why this matters:** `agent_docs/` is documentation, factory module templates, and skill scaffolds — never application source. Including it in the TypeScript compile sweep means template files (with intentional TODO placeholders) become build blockers.

**Fix at kit source:** Add `"agent_docs/**"` to the `exclude` array in `tsconfig.json`. One-line change. Already applied in this project; should be in the kit baseline.

---

## 🟡 No `.env.example`, Build Fails On First Try Without Manual Setup

**Symptom:** Running `npm run build` on a fresh checkout fails during static-page generation:

```
Error occurred prerendering page "/demo"
Error: @supabase/ssr: Your project's URL and API key are required to create a Supabase client!
```

The kit has no `.env.example` or `.env.local.template` file. A new project agent has no signal about which env vars must be set, what they're named, or what shape values take.

**Fix at kit source:** Ship a `.env.example` at the repo root listing all required variables with placeholder values and brief comments. The kit actually references four env vars (verified via grep of `src/`):

- `NEXT_PUBLIC_SUPABASE_URL` — project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — browser-exposed key (Supabase's new naming for the anon key)
- `SUPABASE_SECRET_KEY` — server-side service-role key (Supabase's new naming for the service_role key)
- `NEXT_PUBLIC_SITE_URL` — site URL for auth redirects

Note the kit uses Supabase's **newer key naming convention** (`PUBLISHABLE_KEY` / `SECRET_KEY`) rather than the older `ANON_KEY` / `SERVICE_ROLE_KEY`. The `.env.example` should match what the code actually reads.

The kit's working rules should also instruct: "Step 1 of project setup is `cp .env.example .env.local` and fill values."

**Already applied in this project:** `.env.example` created at repo root during Run 001.

---

## 🟡 Bootstrap Residue Problem

**Symptom:** This repo is the Stark SaaS Starter kit, but it carries leftovers from a previous QR/posts project that was built on top of it. Files contaminating the baseline:

- `package.json` `"name": "qr-next13-supabase-v1"` — should be generic / per-project
- `src/services/{postServices, jsonsrvPostServices}.ts`
- `src/store/{useJsonsrvPostStore, usePostStore}.ts`
- `src/types/posts.ts`
- `src/components/{posts, jsonsrv}/`
- `src/components/admin/AdminBookingList.tsx`, `src/components/members/MemberEventList.tsx`
- `src/app/(admin)/{admin-booking, users}/`, `src/app/(members)/booking/`
- `src/app/api/auth/ghl/` (GoHighLevel integration from prior project)
- `src/utils/jsonSrv/`
- `RECOVERY.md` containing closed-project state on project handoff

**Root cause:** The kit was used to build a prior project, then the same directory was handed off as the seed for a new project. There's no clean "extract the kit" step.

**Fix at process source (recommended workflow):**
1. **Keep one pristine `stark-saas-starter` repo** (e.g., as a git template repo or template branch). Never build a project directly inside it.
2. **For each new project:** clone the pristine starter to a new directory, then customize. The pristine repo stays clean.
3. **Add to `STARTER_PROJECT_OVERVIEW.md`:** a "Starting a New Project" section with these steps:
   - Rename `package.json` `"name"` to project slug
   - Reset `RECOVERY.md` to a fresh state
   - Drop new project module into `agent_docs/CURRENT_APP/`
   - Update the bridge pointer in root `CLAUDE.md` (Active Project Module section)
   - Confirm `agent_docs/SESSIONS/` is empty (or archive prior)

---

## 🟡 RECOVERY.md Lifecycle Gap

**Symptom:** On session start, `RECOVERY.md` contained "Last action: Session close-out... PROJECT COMPLETE. NEW PROJECT — this project is closed." This is the prior project's terminal state. A fresh project on this seed has no signal that `RECOVERY.md` is stale.

**Fix at kit source:**
- Document a **project-end protocol** in the kit: when a project ships, archive `RECOVERY.md` (e.g., move to `agent_docs/COMPLETED_APPS/<project>/RECOVERY_FINAL.md`) and reset the project root file to a clean placeholder template.
- Or ship the kit with a placeholder `RECOVERY.md` that explicitly says "No active project. Begin Phase 0 of the active module."

---

## 🟡 `agent_docs/SESSIONS/` Bootstrap Gap

**Symptom:** Kit's working rules say *"Read latest file in agent_docs/SESSIONS/ — full session history"*. But on a fresh project, the folder is empty and there is no latest file. The agent's recovery instruction has no anchor.

**Fix at kit source:**
- Either pre-seed `agent_docs/SESSIONS/` with a "SESSION_TEMPLATE.md" placeholder that documents the file format and explicitly says "no prior sessions yet — this is Session 1 territory"
- Or update the kit's working rules to say "if SESSIONS/ is empty, this is a fresh project; skip this step."

---

## 🟡 Missing Dependencies for Common UX Patterns

**Symptom:** Most new projects need at least one of: markdown rendering, toast notifications, syntax-highlighted code blocks, safe HTML rendering. The kit doesn't ship any of these.

**Currently missing from `package.json`:**
- `react-markdown` + `remark-gfm` (markdown bodies, tables — needed for any content-display app: docs, blog, chat, comments)
- `react-syntax-highlighter` (code blocks)
- `html-react-parser` (the doctrine-mandated alternative to `dangerouslySetInnerHTML`)
- `sonner` (the Shadcn toast lib; kit has `@radix-ui/react-toast` but the Shadcn `sonner` is the more common pick)

**Fix at kit source:**
- Add these as default dependencies, OR
- Ship a `npm run install:markdown` script that adds them on demand, OR
- Document a "common add-ons" section in `STARTER_PROJECT_OVERVIEW.md`

The dual cost of not having them: each project repeats the install and the integration boilerplate (custom renderers, syntax-highlighter theme picks, etc.).

---

## 🟡 Doctrine Drift: Vitest vs Jest

**Symptom:** Module-level doctrine (e.g., the Factory's project CLAUDE.md template) defaults to Vitest, but the kit reality is Jest 30 with `ts-jest`, `@types/jest`, `jest-environment-jsdom` and an existing 81-test suite. New projects following the doctrine literally would either:
- Try to install Vitest, conflict with Jest, and break the existing suite
- Or quietly switch to Jest without documenting why, drifting from doctrine

**Fix at doctrine source:**
- Update the Factory module template (`agent_docs/CURRENT_APP/<module>/_project/CLAUDE.md`) to reference Jest as the standard, with a "swap to Vitest only if the project requires it" note.
- Or, if Vitest is genuinely preferred, plan a kit migration with the test suite ported.

---

## 🟡 Login Page Branding Is Per-Project

**Symptom:** Every new project will want to rebrand `/auth` (e.g., "Mission Control Login" for Cyberize, something else for the next app). Currently this means editing `src/components/auth/{AuthTabs, LoginForm, RegisterForm}.tsx` directly per project, which forks the kit's code.

**Fix at kit source:**
- Parameterize the title and tagline via a config file (`src/config/auth-branding.ts` or env vars).
- Or document the per-project branding override pattern: "create `src/app/(auth)/auth/page.tsx` to wrap AuthTabs with project-specific branding instead of editing AuthTabs directly."

---

## 🟢 Things That Already Work Well

For balance — these don't need fixing, they're working:

- The three-portal scaffolding (`(superadmin)`, `(admin)`, `(members)`) is a clean foundation
- `protectPage` + role enum + DB trigger pattern is well-thought-out
- Two-file page pattern (`page.tsx` wrapping `PageContent.tsx`) scales well
- Three Supabase clients (`server`, `admin`, `client`) with explicit RLS-respecting vs bypassing roles is sound
- The 81-test baseline is a strong canary for regressions
- The `STARTER_PROJECT_OVERVIEW.md` doc is excellent — explicit, opinionated, names landmines

---

## Recommended Priority Order for Kit Patches

1. **`.env.example` + setup instructions** — currently every new project hits a cryptic build failure on first try. One file fixes onboarding for every future project.
2. **Pristine starter repo + clone workflow** — biggest leverage; eliminates residue contamination entirely.
3. **`tsconfig.json` exclude `agent_docs/**`** — one-line change; otherwise build fails on factory module template files.
4. **Update `STARTER_PROJECT_OVERVIEW.md` line 26** — say `proxy.ts` (Next.js 16), not `middleware.ts`. Add a parenthetical noting the rename.
5. **RECOVERY.md lifecycle** — small fix, big clarity win.
6. **Common dependencies (markdown stack)** — small effort, saves time every project that does any content rendering.
7. **Doctrine alignment on Jest** — clarifies one ambiguity in the Factory module template.
8. **Login branding parameterization** — quality of life, lower urgency.

---

## Process Note

This file accumulates findings. When a kit-level fix lands, mark the entry **RESOLVED** with a date and the commit/PR reference. Future projects read this file during their own Phase 0 to confirm whether each issue still applies.

🥄 *Stark Industries — Continuous Improvement Of The Factory Itself.*
