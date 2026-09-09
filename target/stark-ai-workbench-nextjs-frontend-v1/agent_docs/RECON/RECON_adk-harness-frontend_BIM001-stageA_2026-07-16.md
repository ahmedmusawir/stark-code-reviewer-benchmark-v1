# RECON REPORT — adk-harness-frontend · BIM-001 Stage A

> **Engine:** stark-recon v1.1 · **Payload:** `agent_docs/CURRENT_APP/BIM001/STAGE_A_RECON_MISSION.md`
> **Engineer:** Claudy · **Date:** 2026-07-16 · **Recommended verdict: AMEND** (details in Recommendation)
> Claim source under test: `STAGE_B_MODULE_BRIEF.md` + `STAGE_B_DATA_CONTRACT_AMENDMENT.md` (authored 2026-07-10). Disk wins.
> Labels: EVIDENCE (verified on disk/wire) / INFERENCE / CLAIM / GAP / QUESTION.

---

## Read-Only Integrity Attestation (standing ruling 1)

| Capture | Branch | HEAD | Working tree | Local time |
|---|---|---|---|---|
| BEFORE | `main` | `8ce5240` | ` M CLAUDE.md`, ` M RECOVERY.md`, `?? _SKILLS/`, `?? agent_docs/CURRENT_APP/BIM001/`, `?? agent_docs/CURRENT_APP/README.md`, `?? agent_docs/RESPONSES/`, `?? session_2026-07-16.md`, `?? supabase/CLAUDE.md` | 12:39 |
| AFTER | `bim-001` | `1eafe55` | clean | 14:37 |

- **EVIDENCE:** I executed zero git operations beyond the two sanctioned read-only captures. No source file was modified. Writes made: this report, the pointer file, `agent_docs/RESPONSES/` artifacts, `session_2026-07-16.md`, `RECOVERY.md` (session protocol files, pre-authorized by root CLAUDE.md), plus `npm ci` (standing ruling 3).
- **EVIDENCE (S-8):** Branch/HEAD/tree changed mid-recon — the Operator committed the working tree and switched to a new `bim-001` branch during the run (~12:41–14:37 window). **INFERENCE:** all previously-untracked module docs are now committed on `bim-001`. Not investigated further (ruling forbids other git ops). Consequence recorded under Surprise S-6.

---

## A. Assumption Checklist A1–A12 (the mission's core)

### A1 — chatService signatures ✅ HOLDS
**EVIDENCE:** `src/services/chatService.ts:27` — `sendMessage: async (input: RunAgentRequest): Promise<RunAgentResponse>`; `:40` — `getHistory: async (input: GetHistoryRequest): Promise<Message[]>`. Exactly as claimed.

### A2 — BACKEND_SWAP_NOTES block ✅ HOLDS
**EVIDENCE:** `src/services/chatService.ts:46-60`, quoted verbatim:

```
 * Method       | Endpoint                              | Timeout | Notes
 * -------------|---------------------------------------|---------|---------------------------------
 * sendMessage  | POST {WRAPPER_URL}/run_agent          | 90s     | Bare catch → sentinel response with error string in `response` field
 * getHistory   | POST {WRAPPER_URL}/get_history        | 30s     | Client-side guard: if session_id falsy, no HTTP call, return []
 *
 * Error handling per DATA_CONTRACT §1.5:
 *   On client-side HTTP error, return:
 *     { response: "Error: Could not reach Agent Wrapper. Details: <e>", session_id: undefined }
```

Direct wrapper calls ✓ · 90s/30s ✓ · falsy-session guard ✓ · sentinel `session_id: undefined` ✓. The D1 conflict (sentinel `undefined` vs `RunAgentResponse.session_id: string`) is **real on disk** — see A3.

### A3 — Type shapes in `src/types/index.ts` ✅ HOLDS
**EVIDENCE (file:line):**
- `RunAgentRequest` — `:66-71` — `{ agent_name: AgentName; message: string; user_id: string; session_id: string | null }`
- `RunAgentResponse` — `:74-77` — `{ response: string; session_id: string }` ← D1 conflict confirmed against A2's sentinel
- `GetHistoryRequest` — `:80-84` — `{ agent_name: AgentName; user_id: string; session_id: string }`
- `Message` — `:50-53` — `{ role: MessageRole; content: string }` (`MessageRole = 'user' | 'assistant'`, `:26`)
- `AgentName` — `:18-23` — exactly 5 values: `greeting_agent | jarvis_agent | calc_agent | product_agent | ghl_mcp_agent`
- snake_case wire preserved throughout ✓. Bonus: `GetHistoryResponse { history: Message[] }` exists at `:87-89` — the Amendment's `.history` unwrap already has its type on disk.
- **Nuance (not drift):** `RunAgentRequest.session_id` is `string | null` — Amendment §A1.2 lists the field without noting nullability. Consistent with the falsy-session guard; Stage B should mind the `null` case in the route handler passthrough.

### A4 — `src/app/api/` has no agent routes ✅ HOLDS
**EVIDENCE (full listing):** `auth/confirm`, `auth/login`, `auth/logout`, `auth/signup`, `auth/superadmin-add-user` — auth-only. **Surprise S-1:** an orphan `src/app/api/auth/logout/route-1.ts` sits beside `route.ts` (not routable, but compiles — see Surprises).

### A5 — No `NEXT_PUBLIC_CHAT_MODE` / mode flag ✅ HOLDS
**EVIDENCE:** `grep -rn "NEXT_PUBLIC_CHAT_MODE\|CHAT_MODE" src/` → zero matches. Also absent from `.env.example` and `.env.local` (key names inspected only).

### A6 — No `ADK_WRAPPER_URL` / live wrapper fetch in src ✅ HOLDS
**EVIDENCE:** `grep -rn "ADK_WRAPPER_URL\|adk-wrapper\|run.app" src/` → zero matches. Absent from both env files' key names.

### A7 — Contract + chat component tests exist and are green ✅ HOLDS
**EVIDENCE:** `src/__tests__/services/services.contract.test.ts` and `src/__tests__/chat/ChatPageContent.test.tsx` exist (G2's exact named files), plus 4 more chat suites (`AgentSwitcher`, `ChatInput`, `MessageActions`, `MessageBubble`). Baseline run: green — see §C.

### A8 — profileService map / instructionsService GCS-shape, both mocked ✅ HOLDS
**EVIDENCE:** `src/services/profileService.ts:20` `fetchProfile(userId): Promise<AgentSessionMap>`, `:29` `saveProfile(userId, sessions: AgentSessionMap)`, mock store, Supabase-shaped SWAP_NOTES (`adk_n8n_hybrid_profiles`). `src/services/instructionsService.ts:20,31` — GCS-shaped SWAP_NOTES (`gs://{BUCKET}/{BASE_FOLDER}/{agent}/..._instructions.txt`), open question F7 recorded in-file. Both fully mocked. `AgentSessionMap = Record<AgentName | string, string>` at `types/index.ts:32`.

### A9 — Forbidden-zone paths exist as named ✅ HOLDS
**EVIDENCE:** `src/components/` ✓ · `src/store/` ✓ · `src/mocks/` ✓ · `src/services/index.ts` ✓ (barrel, sole swap point, no authService — matches doctrine). Route group: chat lives at `src/app/(cyberize)/chat/` ✓ (group exists as `(cyberize)`; brief refers to "the route group" without naming it — no drift, but Stage B should name it explicitly).

### A10 — Build/lint/test scripts exist per G10 ⚠️ HOLDS-WITH-DRIFT
**EVIDENCE:** `package.json` scripts: `build: next build` ✓ · `test: jest` ✓ · `lint: next lint` — **exists but is broken** (finding B1, below). G10 as written ("build, lint, and full test suite all pass") is currently unsatisfiable.

### A11 — Wrapper `/health` live ✅ HOLDS
**EVIDENCE (the single authorized GET, 12:39 local):** HTTP **200**, 2.48s, body verbatim:

```json
{"status":"healthy","agents":["greeting_agent","jarvis_agent","calc_agent","product_agent","ghl_mcp_agent"]}
```

Agent list matches the `AgentName` union **exactly** (same 5, same spelling). Matches Stage B docs. No retry needed. URL supplied in-session by Coordinator; not committed by me (but see S-6).

### A12 — No uncommitted drift affecting the above ✅ HOLDS (qualified)
**EVIDENCE:** BEFORE capture — nothing under `src/` modified or untracked; drift confined to docs/skills/session artifacts. **EVIDENCE:** mid-recon the Operator committed everything to new branch `bim-001` (see attestation). No `src/` change occurred in either state. No surprise branches inspected beyond the sanctioned captures.

---

## B. Baseline Findings (§C — logged, not fixed)

### B1 — `npm run lint` is broken; no ESLint config exists ⚠️ (touches gate G10)
**EVIDENCE:** `npm run lint` → `Invalid project directory provided, no such directory: .../lint` (Next.js **16.2.1** — `next lint` was removed in Next 16; the CLI misparses `lint` as a directory). Direct probe `npx eslint src` (ESLint 10.7.0) → `ESLint couldn't find an eslint.config.(js|mjs|cjs) file`. **EVIDENCE:** no `.eslintrc*` or `eslint.config.*` exists anywhere in the repo root. Lint is entirely non-functional. **Logged, not fixed.** → Amendment AM-1.

### B2 — npm audit: 3 vulnerabilities (1 low, 1 moderate, 1 high) ℹ️
**EVIDENCE:** high = `ws` memory-exhaustion DoS (GHSA-96hv-2xvq-fx4p). `npm audit fix` available. **INFERENCE:** dev/tooling dependency chain (ws), not the runtime chat path. Logged, not fixed.

---

## C. Baseline Verification (verbatim summaries)

- **Install:** `npm ci` clean (audit noise only).
- **Tests:** `npx jest` →
  ```
  Test Suites: 20 passed, 20 total
  Tests:       121 passed, 121 total
  Snapshots:   0 total
  Time:        11.585 s
  ```
  (Noise: React `act()` warnings from `AgentInstructionBlock.tsx:41` in mission-control suite — warnings only, all green.)
- **TypeScript:** `npx tsc --noEmit` → exit 0.
- **Build:** `npm run build` → ✓ Compiled successfully (11.0s), 21/21 static pages. Route table (ground truth):
  ```
  ƒ /            ○ /_not-found      ƒ /admin-portal              ƒ /admin-portal/add-member
  ƒ /admin-portal/edit/[id]         ƒ /api/auth/confirm          ƒ /api/auth/login
  ƒ /api/auth/logout                ƒ /api/auth/signup           ƒ /api/auth/superadmin-add-user
  ○ /auth        ƒ /chat            ○ /demo                      ○ /error
  ƒ /members-portal                 ƒ /members-portal/profile    ƒ /mission-control
  ƒ /profile     ƒ /superadmin-portal                            ƒ /superadmin-portal/add-user
  ƒ /superadmin-portal/edit/[id]    ○ /template                  ƒ Proxy (Middleware)
  ```
  No `/api/agent/*` routes exist (consistent with A4). Build noise: caniuse-lite 11 months stale (trivial).

---

## D. Stack Versions (skill Section 1)

- Next.js: **^16.2.1** · React: **^19.2.4** · TypeScript: **^5** · Jest: **^30.0.5** · Tailwind: **^3.4.1** · Node: **not pinned** (no `engines`)
- Test runner: Jest (`"test": "jest"`), plus `test:integration` (jest path filter) and `test:e2e` (Playwright) scripts.

## E. Packaging & Env (skill Sections 6/9, scoped)

- `tsconfig.json` excludes `agent_docs/**` ✓ — module docs don't compile.
- Required env vars (from `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`. No ADK/chat-mode vars yet (per A5/A6).
- `.env.local` (key names only) carries kit residue: `NEXT_PUBLIC_API_BASE_URL` + 6 Stripe keys — none referenced by the chat domain. See S-4.

## F. Sections N/A This Run

Skill Sections 3 (auth deep-dive), 4 (design), 5 (database), 8 (demo scaffolding), 11 (nav variants): **N/A per mission addendum scoping** (BIM chat-domain recon; the Operator-sanctioned payload is A1–A12 + baseline + health). Noted per Operator Override Protocol. Forbidden-zone greps from Section 12 were run — results in Surprises S-3 (one `: any`), `dangerouslySetInnerHTML`: zero, `user_metadata` role smells: zero.

---

## G. Surprises (Section 10 — the gold)

- **S-1 · Orphan route file:** `src/app/api/auth/logout/route-1.ts` — a near-duplicate of `route.ts` beside it. Not routable (only `route.ts` is special) but **it compiles** and is dead code. EVIDENCE. Cleanup candidate — not Stage B's to touch.
- **S-2 · Lint is a mirage (B1):** the script exists, so a doc-reader assumes lint runs. `next lint` is gone in Next 16 and there is **no ESLint config file at all**. G10 as written can never pass. EVIDENCE.
- **S-3 · Forbidden-zone `: any` in a Stage B forbidden zone:** `src/store/useAuthStore.ts:6` — `user: any | null`. Kit-level debt; `src/store/` is forbidden to Stage B, so it stays — but don't let a lint-fix pass wander in there. EVIDENCE.
- **S-4 · `.env.local` predates `.env.example`** (May 26 vs May 29) and carries kit residue (`NEXT_PUBLIC_API_BASE_URL`, Stripe keys) not present in the example. Values not read. EVIDENCE (key names only).
- **S-5 · Positive:** wrapper's live agent list == `AgentName` union, exact match, all 5. The wire contract's most load-bearing enum is already true. EVIDENCE.
- **S-6 · The real wrapper URL is inside the committed module docs:** `STAGE_B_DATA_CONTRACT_AMENDMENT.md` §A1.5 shows the full real Cloud Run URL as its "Example" while standing ruling 2 and §A1.5 itself say the real value is *never committed*. **INFERENCE:** with the Operator's mid-recon commit to `bim-001`, that URL is now in git history. The endpoint is public/unauthenticated by design (brief §7 acknowledges), so exposure is a policy inconsistency more than a new secret leak — but doctrine says flag it. → Amendment AM-2. QUESTION for Coordinator: redact to placeholder + (optionally) scrub history, or accept and record?
- **S-7 · Skill path drift in BIM-001 CLAUDE.md:** claims the skill lives at `_SKILLS/stark-recon-skill-v1.1/stark-recon/`; on disk the skill files sit at `_SKILLS/stark-recon-skill-v1.1/` directly — no nested folder. No execution impact. EVIDENCE.
- **S-8 · Mid-recon repo state change:** branch/HEAD/tree changed under the recon (main@8ce5240 dirty → bim-001@1eafe55 clean) via Operator action. Recorded in the attestation. EVIDENCE.
- `cn()` helper: not checked — N/A to this mission's scope. GAP (trivial).

---

## H. Recommendation to Architect

### Recommended verdict: **AMEND**

Every load-bearing assumption **A1–A11 holds** — signatures, SWAP_NOTES, types, clean grep states, forbidden zones, green baseline (121/121), healthy wrapper with an exactly-matching agent list. Stage B is viable as designed. AMEND rather than GO because two findings touch Stage B's own surfaces:

| # | Assumption → observed reality | Required Stage B edit |
|---|---|---|
| **AM-1** | G10 says "build, lint, and full test suite all pass" → `next lint` is removed in Next 16 and **no ESLint config exists**; lint cannot pass as written (B1/S-2) | Either (a) amend G10 to define the green board as `build + tsc --noEmit + jest` (matches FFM-era verification), or (b) explicitly add "stand up ESLint flat-config" to Stage B scope as named pre-work. Architect's call; (a) is the smaller, honest change |
| **AM-2** | Amendment §A1.5 says real `ADK_WRAPPER_URL` "never committed" → the same row's Example **is** the real URL, in a doc now committed on `bim-001` (S-6) | Redact §A1.5's example to a placeholder; Coordinator to rule whether git history matters (endpoint is deliberately public, per brief §7) |

### Facts Stage B can write against without re-verification
- chatService signatures + SWAP_NOTES verbatim as briefed (A1/A2); types at the exact lines cited (A3); `GetHistoryResponse` already typed.
- D1 sentinel conflict is real and unresolved on disk — Coordinator ruling required pre-Stage-B (entry condition 3). Jarvis's lean (b) touches only chatService; blast radius supports it.
- No agent routes, no mode flag, no wrapper refs in src — greenfield seam (A4–A6).
- Baseline: 20/121 green, tsc clean, build clean, 21-route table above (G2/G10-minus-lint start from green).
- Wrapper healthy @ 200 with the exact 5-agent list (G1 satisfied by this report; re-verify only if >48h pass).
- `RunAgentRequest.session_id` is `string | null` — route handler passthrough must accept `null`.

### Cleanup candidates (NOT Stage B scope — separate authorized pass)
`route-1.ts` orphan (S-1) · `ws` audit high (B2) · `user: any` in useAuthStore (S-3) · `.env.local` kit residue (S-4) · skill-path line in BIM-001 CLAUDE.md (S-7).

### Open questions for Coordinator
1. D1 sentinel ruling (options a/b/c per Amendment §A1.4) — entry condition 3.
2. AM-1 choice: redefine G10 vs add lint-tooling to scope.
3. AM-2: redact-only, or also scrub history?
4. Hosting target confirmation (brief §9 checkbox — affects `maxDuration` note only).

---

*Recon complete. Read-only of the codebase throughout; one authorized GET; no fixes applied. — Claudy, 2026-07-16*
