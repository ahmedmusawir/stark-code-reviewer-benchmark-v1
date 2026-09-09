# EXAMPLE RECON REPORT — Cyber Pharma v1, post-Phase-1, pre-Phase-2

> **A real, successful `stark-recon` run.** This is the shape a finished Recon Report takes. Note how it: leads with the Day-0 sweep; labels findings; flags every doc-vs-disk drift (handbook still says Vitest / ThemeToggle / AppShellPage; APP_BRIEF still names legacy env vars); surfaces real orphans in the Surprises section; and closes with a Recommendation to Architect splitting verified-facts from doctrine-drift from cleanup-candidates from open-questions.
>
> Run by Claudy, 2026-06-08, for the Architect authoring `cyber_pharma_v1_phase2_ffm`. Read-only. No file changes, no git.

---

## Section 0 — Day-0 Ground-Truth Sweep

**S0.1 — Handbook-named files (verified by ls):** Most exist as claimed. Two drifts: `ThemeToggle.tsx` MISSING (actual file is `ThemeToggler.tsx` — handbook bug); `AppShellPage.tsx` listed as a kit primitive but does NOT exist (NEW handbook bug). One orphan: `SuperadminSidebar.tsx` survived the Phase-1 superadmin-route deletion (real bug). `app-role.ts` now EXISTS (Phase 1 fixed the original handbook lie).

**S0.2 — Handbook-claimed exports vs disk:** `useAuthStore` actual shape = `{ user: SupabaseUser|null, role, isAdmin, isMember, isAuthenticated, isLoading, login, logout }`. `isSuperadmin` NOT exposed (operator ruling). Handbook's "all three flags" claim is now partial — store has two.

**S0.3 — Forbidden-zone grep:** `dangerouslySetInnerHTML` = 0. `user_metadata.(is_|role)` = 0 (clean). `: any` = 3 (a shadcn `command.tsx` primitive, a kit-infra `cookies() as any` in server.ts, and test mocks — all flagged).

**S0.4 — Route paths by find:** `(superadmin)` group NOT FOUND (correct, deleted). `superadmin-add-user` NOT FOUND (correct, deleted).

**S0.5 — Test runner:** `"test": "jest"` + `jest@^30.0.5`. Handbook still says Vitest — DRIFT.

**S0.6 — Env names (example + code):** code reads `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL` (Q4-2025 Supabase naming). APP_BRIEF still names legacy `ANON_KEY` / `SERVICE_ROLE_KEY` — DRIFT.

**S0.7 — Build route table:** build exit 0, all prerenders pass, 16 routes. No `/demo`, no `/template`, no `/api/ghl/`, no `(superadmin)/*`. Clean.

---

## Section 1 — Stack Versions

Next `^16.2.1` (App Router, instrumentation stable, proxy.ts not middleware.ts) · React `^19.2.4` · TS `^5` strict · Tailwind `^3.4.1` (HSL+config mechanic, NOT @theme/OKLCH) · Node not pinned · Jest `^30.0.5` (NOT Vitest) · Stripe `22.1.0` installed-but-unused (Phase 2/7 prep) · sass `1.77.6` present but `.scss` removed Phase 1 (dep could be dropped) · Playwright installed, no test files yet.

## Section 2 — Kit Structure vs Handbook

`app-role.ts` now separated from `get-user-role.ts` (Phase 1 fix). `useAuthStore` typed + has `isAdmin`/`isMember`. DRIFT: handbook says `ThemeToggle` (actual `ThemeToggler`); lists `AppShellPage` (doesn't exist). `src/services/` empty (option-b honored). Route groups: `(public)`, `(auth)`, `(members)`, `(admin)` — no `(superadmin)`. `src/proxy.ts` present, `middleware.ts` absent (correct Next 16). **Source-truth for Architect: import `AppRole` from `src/utils/app-role.ts`.**

## Section 3 — Auth Pattern

User read via `useAuthStore` (client) + `supabase.auth.getUser()` (server). Role via `getUserRole()` → `public.user_roles`; `AppRole` enum at `src/utils/app-role.ts`. **No auth service — `src/services/` empty; do NOT author a wrapper.** `user_metadata` role smells = 0 (reads are `full_name` display only). Gates: `protectPage([AppRole.X])` in `(members)` and `(admin)` layouts, tested by `actions.test.ts` (7 cases).

## Section 4 — Design Reality

Token file `src/app/globals.css` (v1.1 dark readability patch applied, CSS not SCSS). HSL-no-wrapper in `:root`+`.dark` mapped via `tailwind.config.ts`. Numbered colors in components = 0. `darkMode: ["class"]`. Saira via `next/font/google`, `--font-brand`, Metro flat (`--radius:0`). `ThemeToggler` on all 4 nav surfaces. In-FFM source-of-truth: `_design/tokens/globals.css` (in sync).

## Section 5 — Database

No `supabase/migrations/`; kit ships single-file `supabase/setup.sql`. Tables: `public.user_roles`, `public.profiles`. Enum `public.app_role ('superadmin','admin','member')` (keeps superadmin value, no UI references). `handle_new_user()` SECURITY DEFINER trigger auto-inserts both rows. RLS: own-role SELECT, own-profile SELECT/UPDATE, all `auth.uid()` matched. **13 Frank-domain tables do NOT exist — Phase 3, not Phase 2.**

## Section 6 — Skills / Security / Env

Skills resolve from `agent_docs/.claude/skills/` (launch CWD = `agent_docs/`, documented). `npm audit` = 0 vulns. No `agent_docs/security/` ledger (operator ruled "audit IS the commit"). 4 required env vars validated at boot by `src/instrumentation.ts`. Repo-root has `CLAUDE.md` (Stark v3.1); no `AGENTS.md`/`GEMINI.md`/`PROJECT_POINTER.md`.

## Section 8 — Scaffolding & Residue

Demo-feature greps = false positives only (copy/comments). Third-party demo APIs = 0. Cross-project residue = 0 (GHL fossil deleted Phase 1). API routes = only `auth/{confirm,login,logout,signup}`. Clean — Phase 1 deletion held.

## Section 9 — FFM Packaging

`tsconfig exclude: ["node_modules", "agent_docs/**"]` (Phase 1 fix landed). 7 `.ts` files under `agent_docs/` all excluded — no tsc-trip risk.

## Section 10 — Surprises (the gold)

**Real orphans:** `SuperadminSidebar.tsx` (consumer deleted, zero refs — DELETE); `DashboardCard.tsx` (zero refs — delete OR keep as Phase-2 starter, QUESTION); empty dirs `components/admin/`, `components/members/` (rmdir or keep as hooks); `command.tsx` unimported shadcn primitive with `{children as any}` (delete or fix). **Kit-infra latent risk:** `server.ts:6` `(await cookies()) as any` — Next 16 cookies() vs `@supabase/ssr@0.6.1` type workaround; real bug surface if Phase 2 touches SSR/cookies. **Stale docs:** APP_BRIEF legacy env names; handbook Vitest/ThemeToggle/AppShellPage; `.env copy.example` MacOS-artifact filename. `cn()` standard shadcn, 16 consumers, no drift.

## Section 11 — Nav & Auth-State (post-fix)

4 nav variants + MobileNav/UserMenu islands. ThemeToggler on every navbar (confirmed by grep). Auth-state region: `UserMenu.tsx` reads store + getUser, renders avatar-dropdown logged-in / Log-in+CTA logged-out (SP5 fix held). Split-hero `lg:grid-cols-[1fr_1.12fr]` (not md: — lesson honored).

## Section 12 — Verification Predicates

Numbered colors = 0 ✅. `: any` in store/utils = 1 (kit-infra cookies cast — flagged). `user_metadata` role smells = 0 ✅. Forbidden directives = 0 ✅.

## Section 13 — src/ tree

(public)/(auth)/(members)/(admin) app groups; components with orphans noted (layout/SuperadminSidebar, dashboard/DashboardCard, empty admin+members dirs, ui/command unimported); services/ empty; store/ (useAuthStore); types/ (User, UserRole, AuthSnapshot, tailwind-merge.d); utils/ (app-role, get-user-role, supabase/*).

---

## Recommendation to Architect

**Write Phase 2 FFM against these verified facts (no re-verification needed):** stack (Next 16.2.1/React 19.2.4/TS strict/Tailwind 3.4.1 HSL+config/Jest — never write "Vitest"); token system locked (globals.css canonical w/ v1.1 patch, inherit don't reinstall); brand (Saira/--font-brand/Metro flat, toggle on all navbars); auth pattern (store + getUser, getUserRole from user_roles, protectPage, NO service wrapper — services land Phase 3); DB (2 kit tables + trigger + RLS, 13 Frank tables are Phase 3); 16 routes, no (superadmin), proxy.ts; **env var names verbatim** (URL/PUBLISHABLE_KEY/SECRET_KEY/SITE_URL — NOT legacy names); Jest baseline 42/42.

**Drift to surface in doctrine (still wrong on disk):** kit handbook v1.0 needs reconciliation (ThemeToggle naming, AppShellPage doesn't exist, Vitest claim); Phase-2 APP_BRIEF must use real Supabase env names.

**Cleanup candidates Phase 2 can pick up:** delete `SuperadminSidebar.tsx`; decide `DashboardCard.tsx` (keep/delete); empty `admin/`+`members/` dirs; `command.tsx` `as any`; `server.ts` cookies cast (if Phase 2 touches SSR); uninstall sass dep; Stripe env validation (if Phase 2 starts wiring).

**Open question before authoring:** Phase 2 = OwedBook screens, which need the 3 KIPs (DataTable, MultiSelect, EmptyState) built FIRST per COMPONENT_MANIFEST §4. Confirm that sequence in the FFM.

---

🛑 Recon complete. No file changes. No git. Pure inspection.
