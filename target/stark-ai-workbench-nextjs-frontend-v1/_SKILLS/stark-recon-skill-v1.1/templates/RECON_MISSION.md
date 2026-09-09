# RECON MISSION — Generic Ground-Truth Questionnaire

> **The payload `stark-recon` executes.** Answer every section from the actual filesystem + grep + build output. Label each finding (EVIDENCE / INFERENCE / CLAIM / GAP / QUESTION). Where any doc and disk disagree, disk wins — flag the drift.
>
> This mission is KIT-AGNOSTIC and PROJECT-AGNOSTIC. The seeded examples reference a past run (Cyber Pharma v1 Phase 1) purely as ILLUSTRATIONS of the drift class each question catches — they are NOT requirements for the current repo. Replace them with what THIS repo actually shows.
>
> Answer in the format of `RECON_REPORT_TEMPLATE.md`.

---

## SECTION 0 — The Day-1 Ground-Truth Sweep (Run 001 Meta-Lesson)

> **THE governing lesson from Cyber Pharma v1 Phase 1:** *the kit handbook (and APP_BRIEF, and every doc) is ASPIRATIONAL, not contractual.* Six confirmed handbook bugs in one run. Every doc claim about disk state that went unverified became a shipped wrong assumption. **Where any doc and the filesystem disagree, the filesystem wins — every time.**
>
> This section is the consolidated "verify before you trust" sweep. Run it FIRST, before authoring anything. Every check here exists because trusting a doc instead of disk cost real time in Run 001.

```bash
# S0.1 — VERIFY EVERY HANDBOOK-NAMED FILE EXISTS (L1, L5)
#   The handbook claimed src/utils/app-role.ts existed. It didn't.
#   For every file the handbook names, confirm it's on disk:
#   (build the list from the handbook, then:)
for f in <each-handbook-named-file>; do ls -la "$f" 2>/dev/null || echo "MISSING (handbook lie): $f"; done

# S0.2 — VERIFY EVERY HANDBOOK-CLAIMED EXPORT/SHAPE MATCHES DISK (L5, L6)
#   Handbook claimed useAuthStore exposes isAdmin/isMember/isSuperadmin. It didn't.
#   Handbook implied user was typed. It was `any`.
#   For each store/util the handbook describes, cat the file and compare the ACTUAL
#   exported shape to the claim. Note every mismatch.

# S0.3 — FORBIDDEN-ZONE GREP AGAINST THE KIT BASELINE (L6)
#   Run the Stark forbidden-zone greps on the KIT ITSELF, day 1 — not at SP-close.
#   The kit shipped `user: any` from init. Catch kit-level violations before authoring.
grep -rn ": any\b\|as any" src/ | grep -v node_modules
grep -rn "dangerouslySetInnerHTML" src/ | grep -v node_modules
grep -rn "user_metadata\.\(is_\|role\)" src/ | grep -v node_modules

# S0.4 — VERIFY EVERY DOC-NAMED ROUTE/PATH BY find (L7)
#   APP_BRIEF said the vuln route was under api/superadmin/. It was at api/auth/.
#   For every "route X is at path Y" claim, find the ACTUAL path before scoping work:
find src/app -type d -name "<claimed-route-segment>"

# S0.5 — VERIFY THE TEST RUNNER (L8)
#   Handbook said Vitest. Kit used Jest. The flag mismatch was the only signal.
grep -E '"test":|vitest|jest' package.json

# S0.6 — GROUND-TRUTH ENV NAMES FROM .env.local.example + CODE, NOT DOCS (L9, L24)
#   APP_BRIEF specified stale Supabase names (anon/service_role). Real code used the
#   Q4-2025 naming (publishable/secret). Doc env names are SUGGESTIVE, not authoritative.
cat .env.local.example .env.example 2>/dev/null
grep -rn "process\.env\." src/ | grep -oP "process\.env\.\w+" | sort -u
#   Confirm env vars are STAGED before any build is asked to pass (L24).

# S0.7 — RUN THE BUILD ROUTE TABLE (L7, L32)
#   The route table is ground truth for "what surfaces actually exist." It surfaced
#   /demo, /template, /api/ghl/ (a year-old QR fossil), and the real vuln-route path.
npm run build 2>&1 | grep -E "Route|/|├|└" | head -60
```

**The rule:** when this sweep and a doc disagree, the sweep wins, and the doc gets flagged for correction (kit handbook v3). Don't author a single FFM line against an unverified doc claim. Every handbook bug in Run 001 (L1, L5, L6, L7, L8 — plus the env-name and runner drift) would have been caught here on Day 1 instead of mid-build.

---

## SECTION 1 — Stack Versions

The global doctrine pins versions that age. The repo's `package.json` is the only truth.

```bash
# Q1.1 — Next.js version
grep '"next"' package.json

# Q1.2 — React version
grep '"react"' package.json

# Q1.3 — Tailwind version (determines token mechanic: HSL/config vs @theme/OKLCH)
grep tailwindcss package.json

# Q1.4 — TypeScript version
grep '"typescript"' package.json

# Q1.5 — Node version (if pinned)
cat .nvmrc 2>/dev/null; grep '"node"' package.json 2>/dev/null

# Q1.6 — full dependency snapshot for anything the FFM will reference
cat package.json

# Q1.7 — Which test runner does the kit ACTUALLY use? (don't trust the handbook)
#         Phase 1 found: doctrine said Vitest, kit used Jest.
grep -E '"test"|vitest|jest' package.json
```

**Architect uses this to:** write exact versions into `_project/CLAUDE.md` § Tech Stack, so the Engineer never surfaces a stack conflict at Discovery. Global defaults are the fallback; the repo wins.

---

## SECTION 2 — Kit Structure vs Handbook Claims

The handbook describes what the kit *should* contain. The filesystem describes what it *actually* contains. When they disagree, the filesystem wins and the drift gets recorded.

```bash
# Q2.1 — Verify every file the handbook claims exists
#         (run for each path the handbook names in its "files already separated" section)
ls -la src/utils/
ls -la src/services/ 2>/dev/null
ls -la src/store/ 2>/dev/null
ls -la src/types/

# Q2.2 — Where is a given exported symbol ACTUALLY defined?
#         (the app-role.ts lesson: handbook said one file, reality was another)
grep -rn "export.*AppRole" src/ | grep -v node_modules
grep -rn "export.*getUserRole" src/ | grep -v node_modules

# Q2.3 — Route group inventory (confirm what (groups) actually exist)
find src/app -maxdepth 1 -type d -name "(*)"

# Q2.4 — What's ALREADY in src/services/? (don't author wrappers for what exists)
ls -la src/services/ 2>/dev/null && echo "--- contents ---" && \
  for f in src/services/*; do echo "## $f"; head -20 "$f" 2>/dev/null; done

# Q2.5 — Middleware vs proxy (Next 16 ships src/proxy.ts, not middleware.ts)
ls -la src/middleware.ts src/proxy.ts 2>/dev/null
```

**Architect uses this to:** stop inheriting handbook errors. Every file path written into the FFM is one Claudy confirmed exists. Drift gets logged as a "kit reconciliation" task for the appropriate sub-phase.

---

## SECTION 3 — Auth & RBAC Pattern (The authService Trap)

The single most common conflict: DATA_CONTRACT defines a service wrapper for auth the kit already provides complete. Verify what the kit actually does BEFORE writing any service contract.

```bash
# Q3.1 — How do components currently read the authenticated user?
grep -rn "useAuthStore\|useUser\|getUser\|getCurrentUser" src/ | grep -v node_modules | head -20

# Q3.2 — How is the user's ROLE resolved?
grep -rn "getUserRole\|resolveRole\|AppRole\|user_roles" src/ | grep -v node_modules | head -20

# Q3.3 — Is there an existing auth service, or is auth consumed directly?
ls -la src/services/*auth* 2>/dev/null
grep -rn "authService\|AuthService" src/ | grep -v node_modules

# Q3.4 — SECURITY: any roles read from user_metadata? (forbidden smell)
grep -rn "user_metadata" src/ | grep -v node_modules

# Q3.5 — How does the kit gate protected routes?
grep -rn "protectPage\|requireAuth\|redirect.*login" src/ | grep -v node_modules | head -10

# Q3.6 — EXACT shape of the auth store (handbook claims derived flags that may not exist)
#         Phase 1 found: handbook claimed isAdmin/isMember/isSuperadmin; store had none.
cat src/store/useAuthStore.ts 2>/dev/null
grep -n "isAdmin\|isMember\|isSuperadmin\|isAuthenticated\|role" src/store/useAuthStore.ts 2>/dev/null

# Q3.7 — Type-safety smells in the auth store (Phase 1 found user: any)
grep -n ": any\|as any" src/store/useAuthStore.ts src/utils/get-user-role.ts 2>/dev/null
```

**Architect uses this to:** decide whether DATA_CONTRACT needs ANY service contracts. If the kit provides auth complete (it usually does), DATA_CONTRACT says "consume the kit's primitives directly — no wrapper." Service layer is reserved for project-specific domain logic only. Also: write the FFM's `_project/CLAUDE.md` against the store's ACTUAL shape (Q3.6) — if the handbook claims derived flags the store doesn't have, schedule adding them (or correcting the handbook) as a kit-reconciliation task, and don't write FFM code that reads flags that return `undefined`. Type smells (Q3.7) like `user: any` become reconciliation tasks (replace with the project's `User` type).

---

## SECTION 4 — Design System & Token Reality

The token mechanic depends entirely on the Tailwind major version (already captured in Q1.3). This section inventories what the kit hardcodes so the reconciliation task is scoped accurately.

```bash
# Q4.1 — Where do tokens currently live?
ls -la src/app/globals.css src/styles/globals.css 2>/dev/null
grep -l "@theme\|:root" src/**/*.css 2>/dev/null

# Q4.2 — Numbered Tailwind colors hardcoded in components (reconciliation scope)
grep -rn "slate-\|zinc-\|gray-\|red-6\|red-5\|green-6\|blue-6\|purple-6\|amber-6" src/components/ src/app/ 2>/dev/null | grep -v node_modules | wc -l
echo "--- detailed list ---"
grep -rn "slate-\|zinc-\|gray-\|red-6\|red-5\|green-6\|blue-6\|purple-6\|amber-6" src/components/ src/app/ 2>/dev/null | grep -v node_modules

# Q4.3 — Current dark mode mechanism (class vs media)
grep -n "darkMode" tailwind.config.* 2>/dev/null

# Q4.4 — Existing font setup (will the designer's font wiring conflict?)
grep -rn "next/font\|@font-face\|fonts.googleapis" src/ | grep -v node_modules

# Q4.5 — Theme toggle present? (designer themes need a working switcher)
grep -rn "ThemeToggle\|useTheme\|setTheme" src/ | grep -v node_modules | head

# Q4.6 — CSS EXTENSION MATCH: kit's entry CSS vs designer's deliverable (L14)
#   Kit shipped globals.SCSS (Sass); designer shipped globals.CSS. Mismatch = a
#   conversion task that must be scoped in Cluster 2, not discovered mid-build.
ls -la src/app/globals.* src/styles/globals.* 2>/dev/null
#   If .scss: grep for Sass-only syntax that won't survive a .css rename:
grep -n "//\|@mixin\|@include\|\$[a-z]\|&:" src/app/globals.scss 2>/dev/null
#   (nested rules + // comments are Sass-only; @apply works in both)

# Q4.7 — DARK-MODE READABILITY needs a REAL-SCREEN pass, not just style-tile (L16)
#   Style tile passed; real Slate screens were nearly unreadable (background == card,
#   borders too soft, muted-foreground too dim). The check below is OPERATOR-RUN, not
#   greppable: token-lock requires BOTH style-tile review AND an npm run dev walk of
#   the major dark surfaces — cards-on-background, secondary text, form-field
#   placeholders, borders. Flag this as a required gate BEFORE the build phase, not after.
echo "Q4.7 is an operator real-screen dark-mode check — see token-lock gate"
```

**Architect uses this to:** scope the kit-reconciliation task precisely (exact count and location of hardcoded colors), confirm the token install path, and flag font/theme-toggle conflicts before the designer's tokens land.

---

## SECTION 5 — Database & Schema Reality

Confirm what tables/triggers actually exist vs what the FFM assumes is in or out of scope.

```bash
# Q5.1 — Migration files present
ls -la supabase/migrations/ 2>/dev/null

# Q5.2 — Tables the kit ships (read the migrations)
grep -rn "create table\|CREATE TABLE" supabase/ 2>/dev/null | grep -v node_modules

# Q5.3 — Triggers/functions the kit ships (e.g. handle_new_user)
grep -rn "create function\|CREATE FUNCTION\|create trigger\|CREATE TRIGGER" supabase/ 2>/dev/null

# Q5.4 — RLS policies present?
grep -rn "policy\|POLICY\|row level security\|RLS" supabase/ 2>/dev/null | head
```

**Architect uses this to:** write DATA_CONTRACT's "tables in play / NOT in play" sections from reality, and confirm which DB functions are inherited vs need building.

---

## SECTION 6 — Skills, Security, & Environment

Confirm the runtime prerequisites the playbook's sequencing section expects.

```bash
# Q6.1 — Skills present (NOTE: resolve from the CWD Claude Code launches from)
ls -la .claude/skills/ 2>/dev/null
pwd  # confirm where Claude Code is launched — skills resolve relative to this

# Q6.2 — Security audit state
ls -la agent_docs/security/ 2>/dev/null
npm audit 2>&1 | tail -5

# Q6.3 — Required env vars (what does the kit expect?)
cat .env.example .env.local.example 2>/dev/null
grep -rn "process.env\." src/ | grep -v node_modules | grep -oP "process\.env\.\w+" | sort -u

# Q6.4 — Existing CLAUDE.md / AGENTS.md / pointer files at repo root
ls -la CLAUDE.md AGENTS.md GEMINI.md PROJECT_POINTER.md 2>/dev/null

# Q6.5 — Where does Claude Code launch from? (skills + relative paths depend on this)
#         Document this in RECOVERY.md so future sessions launch consistently.
```

**Architect uses this to:** confirm sequencing prerequisites, write the correct env-var fail-closed check list, and note the launch-CWD requirement (the skills-path nuance from Phase 1).

---

## SECTION 8 — Demo / Tutorial Scaffolding (The Cascade Trap)

Starter kits ship tutorial filler — example features demonstrating patterns — that is NOT product code. Phase 1 found a whole "posts" demo cascade: 2 services → 2 stores → 1 types file → 2 components → 3 routes → 1 util, all inherited and all dead weight. Find the WHOLE cascade up front so the Architect can scope its deletion into the FFM from the start.

```bash
# Q8.1 — Obvious demo/example feature names (posts, todos, booking, blog, sample)
grep -rln "posts\|todos\|booking\|sample\|example\|demo\|jsonplaceholder" src/ | grep -v node_modules

# Q8.2 — Third-party demo API calls (a dead giveaway of tutorial code)
grep -rn "jsonplaceholder\|dummyjson\|fakestoreapi\|reqres.in\|typicode" src/ | grep -v node_modules

# Q8.3 — Trace the full cascade for any demo feature found
#         (service → store → component → route → types → util)
#         For each demo name found in Q8.1, grep for its imports to map the fan-out:
#         grep -rn "import.*<demoName>" src/
#         Report the COMPLETE file list so deletion is one clean pass, not whack-a-mole.

# Q8.4 — Prior session logs flagging "legacy / do not touch / ignore" dirs
grep -rn "legacy\|do not touch\|DO NOT\|ignore\|deprecated" agent_docs/ 2>/dev/null | head

# Q8.5 — INHERITED CROSS-PROJECT RESIDUE (clone-debt from prior projects)
#         Phase 1 found a year-old GoHighLevel hooktest from a QR project riding along.
#         Grep for old project names, stale integrations, forgotten API stubs.
grep -rn "ghl\|gohighlevel\|hooktest\|webhook" src/app/api/ 2>/dev/null
find src/app/api -type d  # eyeball every API route — any that belong to NO current feature?

# Q8.6 — FULL ROUTE TABLE INVENTORY (run the build, read the route list day 1)
#         Phase 1's extra cruft (/demo, /template, /api/ghl, /profile) surfaced here.
#         Every route should map to THIS project or kit baseline — anything else is suspect.
npm run build 2>&1 | grep -E "^\s*[├└]|Route|/" | head -50
```

**Architect uses this to:** scope a "demo cascade deletion" task into the FFM's Components sub-phase from day one, with the COMPLETE file list. Without this, the cascade gets discovered piecemeal mid-build (as it did in Phase 1) and the deletion becomes whack-a-mole. Knowing the full fan-out lets the deletion happen in one verified pass.

---

## SECTION 9 — FFM Packaging & Compile Scope

The FFM itself can break the build if its template files land inside the TypeScript or test scope. Phase 1 found the FFM's `.ts` template stubs (in `skills/templates/` and `_design/tokens/`) caught by `tsc --noEmit`, throwing 3 phantom errors in non-source files.

```bash
# Q9.1 — Does tsconfig exclude the FFM/agent_docs tree?
cat tsconfig.json | grep -A10 '"exclude"'
#   If agent_docs/** (or wherever the FFM lands) is NOT excluded, the FFM's
#   .ts template stubs will be compiled and may throw phantom errors.

# Q9.2 — Does the test runner scope exclude agent_docs?
grep -rn "include\|exclude\|testMatch\|dir" vitest.config.* jest.config.* 2>/dev/null

# Q9.3 — What .ts/.tsx files live under agent_docs (would-be compile targets)?
find agent_docs -name "*.ts" -o -name "*.tsx" 2>/dev/null | grep -v node_modules
```

**Architect uses this to:** ship the FFM with the right packaging — either (a) instruct the operator to add `agent_docs/**` to tsconfig `exclude`, or (b) name the FFM's template stubs with a non-compiled extension (`.ts.txt`) so they never enter compile scope. This is a self-inflicted conflict the FFM author can prevent entirely.

---

## SECTION 11 — Nav & Auth-State Patterns (The Landing/Nav Lessons)

The landing page took 3 iterations and the marketing nav stranded logged-in users. These checks turn those scars into upfront questions.

```
# Q11.1 — Marketing nav vs portal nav are DIFFERENT (L19)
#   Marketing nav has real destinations (esp. Log in) → needs a mobile hamburger.
#   Portal nav for placeholder portals (no Dashboard/Settings yet) → logo + user menu.
#   For EACH nav surface, ask separately: does it have real mobile destinations?
#   Marketing-nav default = hamburger REQUIRED.

# Q11.2 — Every navbar has a theme toggle (L20)
#   Theme is a UX setting that applies everywhere, including logged-out marketing pages.
#   Confirm the theme toggle is reachable from EVERY navbar surface, not just portals.

# Q11.3 — Every public/marketing route has an auth-state region DEFINED (L22)
#   "No auto-redirect" does NOT mean "no auth awareness." A logged-in user landing on /
#   must still see they're logged in + reach their portal + log out.
#   For each public route, define: what shows logged-IN vs logged-OUT? (Not just routing.)
#   Distinguish ROUTING-behavior (don't bounce them) from UI-STATE (reflect their state).

# Q11.4 — Complex split-hero transforms at lg:, not md: (L18)
#   A two-column hero (copy + visual-that-needs-width) squishes in the 768-1023 range.
#   For any split hero, the side-by-side engages at lg: (1024px). md: is for text/size
#   transitions only, not layout pivots. Ask: what breakpoint engages side-by-side?
#   If md: → flag for review.

# Q11.5 — "Always-visible" mobile controls sit OUTSIDE the hamburger (L21)
#   Navigation belongs in the menu; controls (theme toggle, search, avatar) stay at top
#   level for single-tap reach. Confirm the split.
```

**Architect uses this to:** spec navbars correctly the first time — marketing nav gets a hamburger + theme toggle + auth-state region; split heroes default to `lg:`; controls stay outside the menu. Prevents the 3-iteration landing churn.

---

## SECTION 12 — Verification Rituals (What Piecewise Gates Miss)

Each gate passed in isolation; the continuous SP5 walk caught a real bug no gate's grep could. These checks bake the verification lessons into the FFM upfront.

```
# Q12.1 — Every grep-verifiable gate runs its grep AT SP-CLOSE (L17)
#   "Sample-check one file then trust the rest" is BRITTLE — it hid 5 numbered-color
#   sites in shadcn primitives until SP-close panic. For any gate with a grep-verifiable
#   predicate (no numbered colors, no user_metadata, no forbidden imports), the grep
#   RUNS at SP-close as a standard step. Sample-then-trust is DISALLOWED for these.

# Q12.2 — Boot/instrumentation checks verify PROCESS STATUS, not just logs (L28)
#   Turbopack prints "✓ Ready" BEFORE an instrumentation throw propagates — looks like
#   the server started when it actually died. Verify with curl/port-check that the
#   process is actually gone, plus a success-log line ("✓ Environment validated") as the
#   only unambiguous "hook fired + passed" signal.

# Q12.3 — SP5 includes a SEAM-CHECK: walk every transition in every auth state (L29)
#   Gates measure components in isolation; bugs live in the SEAMS. The continuous walk
#   (login → role → portal → gate → logout → back to /) caught the auth-stranding bug.
#   SP5 ritual = "navigate every surface in every auth state," not just the happy path.

# Q12.4 — Between deletion batches, rm -rf .next before tsc smoke (L25)
#   Stale .next/types/validator.ts references deleted routes → false-failure noise
#   indistinguishable from real orphaned imports. Clear .next before per-batch tsc.

# Q12.5 — Run pre-deletion test baseline FRESH; don't trust historical counts (L26)
#   A prior session log was 3 tests behind. Predict from a fresh run, not history.
```

**Architect uses this to:** write verification sub-phases that close gates honestly (grep-at-close), prove boot checks correctly (process status), and make SP5 a real seam-check instead of a formality.

---

## SECTION 13 — Open-Ended Sweep

The questions above are the known traps. This section catches the unknown ones.

```bash
# Q10.1 — Full src/ tree (2 levels) so the Architect sees the actual shape
find src -maxdepth 2 -type d | sort

# Q10.2 — Anything in the repo that contradicts what the operator described?
#         (Claudy reports any surprise: stale scaffolding, unexpected dirs,
#          vestigial template strings, half-finished features)

# Q10.3 — Vestigial template residue (starter kits leave these)
grep -rn "Your Company\|Acme\|TODO\|FIXME\|placeholder\|lorem ipsum" src/ | grep -v node_modules | head -20

# Q10.4 — The cn() helper every component depends on
cat src/lib/utils.ts 2>/dev/null | grep -A5 "export.*cn"
```

**Architect uses this to:** catch the things no questionnaire anticipated. The open-ended sweep is where the NEXT lesson gets discovered.

---
