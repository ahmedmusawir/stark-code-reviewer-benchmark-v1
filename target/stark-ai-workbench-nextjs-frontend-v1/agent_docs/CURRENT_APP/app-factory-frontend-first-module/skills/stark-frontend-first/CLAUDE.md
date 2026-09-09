# stark-frontend-first — CLAUDE.md

> **Skill Type:** Agent Skill (auto-loads when project is in frontend-first mode)
> **Owner:** Stark Industries AI App Factory
> **Version:** 1.0 | May 2026

---

## Mission Brief

You are operating in a Factory project that is in **Frontend-First Phase**. This means:

- The frontend is being built BEFORE the backend
- All data is mocked behind a service layer
- The service layer is the **sole swap point** for backend later
- UI components NEVER talk to data sources directly
- Backend doesn't exist yet, won't exist in this phase, and you DO NOT author backend code

This skill governs **how you build the frontend** so that the eventual backend swap is smooth and the UI never has to be rewritten.

If you are about to write Supabase queries, API route handlers, database schemas, or any backend-touching code in a project under this skill — **stop**. That's out of scope. Surface it to the operator.

---

## When This Skill Activates

This skill activates when ANY of the following are true:

- Project root CLAUDE.md declares `phase: frontend-first` or `mode: mock-data`
- An `APP_BRIEF.md` exists at project root and the brief says frontend-first
- A `/src/mocks/` folder exists or is intended
- The operator says "build the frontend first" or "mock data only" or "service layer mode"
- The project is a Next.js conversion of a Streamlit, Gradio, or similar prototype

If unsure whether the skill applies, ASK the operator before proceeding.

---

## Folder Layout

```
stark-frontend-first/
├── CLAUDE.md                              ← you are here
├── SKILL.md                               ← methodology (read after CLAUDE.md)
├── workflow/
│   ├── 00-discovery.md                    ← project orientation
│   ├── 01-types-and-contract.md           ← types and data contract
│   ├── 02-service-layer.md                ← service layer scaffolding
│   ├── 03-mock-data.md                    ← mock data generation
│   ├── 04-components.md                   ← component build
│   └── 05-verification.md                 ← gate checks before declaring done
├── references/
│   ├── SERVICE_LAYER_PATTERNS.md          ← swap-point examples, do/don't
│   ├── MOCK_DATA_PATTERNS.md              ← realistic mock generation
│   ├── COMPONENT_CONVENTIONS.md           ← Shadcn + Tailwind + Zustand
│   └── ANTI_PATTERNS.md                   ← failure modes to avoid
└── templates/
    ├── service.template.ts                ← starter service file
    ├── mock-data.template.ts              ← starter mock data file
    └── types.template.ts                  ← starter type definition
```

Workflow files run in order. References are pulled by SKILL.md when relevant. Templates are copied and adapted into the target project.

---

## Reading Order

When activated:

1. Read THIS file (CLAUDE.md) for doctrine — done by now
2. Read `SKILL.md` for the v2-formatted methodology
3. Pull workflow files in order as you execute phases
4. Pull references on demand when phase needs them

---

## Doctrine (Non-Negotiable)

These rules apply through the entire skill execution. Violations are surfacing-required.

### 1. Plan Mode Before Code

Before any file creation, modification, or refactor:

- Enter Plan Mode
- Write plan to session file as PENDING_APPROVAL
- Present plan in CLI
- Wait for operator approval ("approved", "go", "do it")
- Execute only what was approved

This inherits from the global Stark CLAUDE.md. This skill does NOT override Plan Mode — it operates within it.

### 2. The Service Layer Is The Only Swap Point

UI components NEVER:
- Import Supabase clients
- Call `fetch()` directly to backend APIs
- Read from a database
- Talk to mock data files directly

UI components ALWAYS:
- Call domain-named service methods (`bugService.getAll()`, `chatService.sendMessage()`)
- Receive data shaped by `/types`

When the backend is swapped in later, **only `/services` files change**. Components stay untouched. This is the success metric.

### 3. Types Are The Contract

Every data shape that flows through the app has a type in `/src/types/`. Types are derived from `DATA_CONTRACT.md`. If you find yourself inventing a field while building UI, STOP — that field must be added to the data contract first.

Both mock and real implementations satisfy the same type interface. The type is what makes the swap safe.

### 4. Mock Data Is Temporary

Mock data lives in `/src/mocks/`. Every mock file is deletable. When backend phase begins, the entire `/mocks/` folder is removed in one commit.

Mock data must:
- Match the data contract field-for-field
- Be realistic enough for stakeholder demos
- Cover loading, empty, error, and edge states
- Never become permanent

### 5. UI Must Survive Backend Replacement Unchanged

This is the test. If swapping the service layer from mock to real forces you to change a component, you broke the pattern.

### 6. Backend Code Is Forbidden In This Phase

You DO NOT:
- Write API route handlers in `/app/api/`
- Author Supabase migrations
- Write SQL
- Configure RLS policies
- Touch auth backend logic beyond what the starter kit provides
- Generate database schemas

The starter kit may have auth wired. That's fine — use it as-is. Do not extend backend.

If a feature requires backend work, flag it: **"This feature needs backend. Out of scope for frontend-first phase. Recommend: add to phase 2 backlog."**

### 7. Eyesight-Aware Communication

Explanations come BEFORE code blocks. The operator listens to audio playback during eye rest — no surprises. This inherits from global Stark CLAUDE.md.

### 8. Surface Conflicts, Don't Average

When `DATA_CONTRACT.md` conflicts with `UI_SPEC.md` or with existing code, pick one and flag the other. Don't blend. Don't silently resolve.

---

## Activation Behavior

When the operator says "start frontend-first phase" or equivalent:

1. **Discover** — check for `APP_BRIEF.md`, `DATA_CONTRACT.md`, `UI_SPEC.md`, `FILE_TREE.md`. List what exists, what's missing.
2. **Read** — load existing factory docs in this order: APP_BRIEF → DATA_CONTRACT → FILE_TREE → UI_SPEC.
3. **Confirm** — present your understanding back to operator: "Here's what I see. Correct me before I start."
4. **Plan** — enter Plan Mode for the first concrete task (typically types + contract).
5. **Execute on approval** — build incrementally, one workflow phase at a time.

If any factory doc is missing, ASK before proceeding. Do not invent the brief or the contract.

---

## Operator Override Protocol

The operator can override any rule in this skill EXCEPT:

- Plan Mode requirement (this is global, not skill-local)
- The backend-code-forbidden rule (the entire skill premise)

Override syntax: operator says "override [rule X] because [reason]." You acknowledge, you proceed, you note the override in the session file.

If operator says "build the backend too," that's not an override — that's a phase transition. Tell them: "This means we're leaving frontend-first phase. Want me to flag the transition and update CLAUDE.md at project root?"

---

## Anti-Patterns (Failure Signals)

If you catch yourself doing any of these, STOP and surface:

- About to write a `fetch('/api/...')` call in a component
- About to import `@supabase/supabase-js` in a component
- About to read from `/src/mocks/` inside a component
- About to invent a field that's not in `DATA_CONTRACT.md`
- About to skip Plan Mode "because it's just mock data"
- About to declare the frontend "done" without empty/loading/error states
- About to mark the phase complete without UI being responsive on mobile
- About to keep mock infrastructure that "might be useful later"

---

## Success Criteria

This skill's phase is complete when ALL are true:

- All pages from `UI_SPEC.md` are navigable
- All data flows through the service layer (zero direct calls)
- Empty, loading, and error states are implemented for every data-dependent screen
- Mobile responsiveness is verified
- All types match `DATA_CONTRACT.md` exactly
- Stakeholder demo runs cleanly on mock data
- A `BACKEND_SWAP_NOTES.md` exists at project root documenting what each service method will need from the real backend

When complete, the project is ready for **Phase 2: Backend Swap**. That phase is operator-driven and uses different skills.

---

## Evolution Principle

When this skill stumbles on a real project, the operator and you together update this CLAUDE.md or the workflow files. The skill grows from real usage, not theoretical perfection. Every project run is a chance to make the next run sharper.

Findings worth capturing:
- A new anti-pattern → add to ANTI_PATTERNS.md
- A new service layer trick → add to SERVICE_LAYER_PATTERNS.md
- A new gotcha for a specific stack (ADK, Stripe, etc.) → add to references/
- A skill rule that conflicts with reality → revise the rule, version-bump

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-23 | Initial skill compiled from FRONTEND_FIRST_PLAYBOOK.md, UI-UX-BUILDING-MANUAL.md, APP_ARCHITECTURE_MANUAL.md, and STARK_SKILLS_PLAYBOOK conventions |

---

*Part of the Stark Industries AI App Factory skill ecosystem.*
*Pairs with: stark-nextjs-shadcn-conventions (sibling skill), stark-tdd-flow (sibling skill).*
