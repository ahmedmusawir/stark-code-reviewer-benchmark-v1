---
name: stark-frontend-first
description: Build the frontend of a Next.js application before the backend exists, using a service layer with mock data as the sole swap point for later backend integration. Use this skill when a project is in frontend-first phase, when converting a Streamlit/Gradio/prototype to Next.js, when stakeholders need a working UI demo before backend work begins, or when the project root CLAUDE.md declares mock-data mode. The skill enforces service layer discipline, mock data conventions, type-driven contracts, and forbids any backend code authoring during this phase.
---

# Stark Frontend-First Skill

You are building the frontend of a Next.js app. The backend does not exist yet, won't be built in this phase, and you will not author backend code. Your output is a fully functional UI behind a mocked service layer — designed so that swapping to a real backend later requires zero changes to components.

This skill is the methodology. Read CLAUDE.md first for doctrine and activation rules.

## Phase Sequence

Frontend-first work proceeds in six phases. Do not skip phases. Do not reorder.

```
0. Discovery  →  1. Types & Contract  →  2. Service Layer  →  3. Mock Data  →  4. Components  →  5. Verification
```

Each phase has a verification gate. Do not advance until the gate passes.

---

## Phase 0 — Discovery

**Goal:** Orient yourself in the project before touching any code.

**Steps:**

1. Read `RECOVERY.md` if it exists. If you're resuming a session, you know where to pick up.
2. Read `APP_BRIEF.md` for what this project is.
3. Read `DATA_CONTRACT.md` for data shapes.
4. Read `UI_SPEC.md` for screens and behavior.
5. Read `FILE_TREE.md` for expected structure.
6. Read project root `CLAUDE.md` for project-specific overrides.
7. Inspect existing code: `/app`, `/components`, `/services`, `/types`, `/mocks` if any.
8. If a starter kit is in use, identify what it provides (auth, RBAC, layout) and what's left to build.

**Verification gate:** You can answer these without guessing:
- What is this app?
- Who uses it?
- What screens does it have?
- What data shapes flow through it?
- What's already built vs what's missing?

If you cannot answer, ASK the operator before proceeding.

---

## Phase 1 — Types & Contract

**Goal:** Establish the type contract that both mock and real implementations will satisfy.

**Steps:**

1. Read `DATA_CONTRACT.md` carefully.
2. For each entity in the contract, create a TypeScript interface in `/src/types/`.
3. One file per major entity: `/src/types/User.ts`, `/src/types/Message.ts`, etc. Or one `index.ts` with all types if the project is small.
4. Match field names exactly. Match optionality exactly. Match enums exactly.
5. If `DATA_CONTRACT.md` is ambiguous about a field's type or nullability, ASK — do not assume.
6. Export everything cleanly from `/src/types/index.ts`.

**Anti-pattern check:**
- ❌ Inventing fields not in the contract
- ❌ Renaming fields for "clarity"
- ❌ Adding optional fields "just in case"
- ❌ Using `any` to avoid thinking

**Verification gate:** Every entity in `DATA_CONTRACT.md` has a corresponding TypeScript type. Types compile cleanly. No `any` types.

---

## Phase 2 — Service Layer Scaffolding

**Goal:** Build the service layer skeleton with method signatures, before any data exists.

**Steps:**

1. Create `/src/services/` if it doesn't exist.
2. For each domain in the app, create a service file: `userService.ts`, `chatService.ts`, `agentService.ts`.
3. Each service exports an object with domain-named methods:
   ```typescript
   export const chatService = {
     sendMessage: async (params): Promise<MessageResponse> => { ... },
     getHistory: async (sessionId): Promise<Message[]> => { ... },
   };
   ```
4. Method names match user intent, not HTTP verbs. `getCurrentSubscription` not `fetchSubscription`. `updateInstructions` not `postUpdate`.
5. Every method has a return type from `/src/types/`.
6. Implementations are stubs at this stage — `throw new Error('Not implemented')` or return a hardcoded type-correct placeholder. Real mocks come in Phase 3.

**Anti-pattern check:**
- ❌ Implementing services that talk to a real backend "just to test"
- ❌ Putting HTTP fetch logic in components instead of services
- ❌ Service methods that return `any` or untyped data
- ❌ Service files that import Supabase clients in frontend-first phase

**Verification gate:** Every data operation the UI will need has a typed service method. Method signatures match the data contract. The file structure mirrors `FILE_TREE.md`.

---

## Phase 3 — Mock Data

**Goal:** Generate realistic mock data that satisfies the type contract and supports stakeholder demos.

**Steps:**

1. Create `/src/mocks/data/` for the mock data files.
2. Create `/src/mocks/services/` for the mock service implementations (optional pattern — see SERVICE_LAYER_PATTERNS.md).
3. For each entity, author a mock data file: `users.ts`, `messages.ts`, `agents.ts`.
4. Use plain typed objects:
   ```typescript
   import type { User } from '@/types';

   export const users: User[] = [
     { id: 'user-1', email: 'tony@stark.com', name: 'Tony Stark', ... },
     // ...
   ];
   ```
5. Quantity: enough to demo, not so many it slows dev. 5-20 per entity is usually right.
6. Realism: names that look real, dates that make sense, edge cases included (one expired item, one with missing optional field, one with maxed-out values).
7. Update the service layer to return this mock data:
   ```typescript
   import { users } from '@/mocks/data/users';
   export const userService = {
     getAll: async () => users,
     getById: async (id) => users.find(u => u.id === id) ?? null,
   };
   ```

**Mock data must cover:**
- Happy path (default state with data)
- Empty state (no data)
- Loading state (handled by service returning a promise the UI awaits)
- Error state (service throws an error — UI must handle)
- Edge cases (max length text, special characters, missing optional fields)

**Anti-pattern check:**
- ❌ Components reading from `/mocks/` directly
- ❌ Mock data that doesn't match types
- ❌ Mock data with placeholder text like "Lorem ipsum" or "Test 1, Test 2"
- ❌ Mock data missing edge case coverage

**Verification gate:** Mock data satisfies every type. Every service method returns from mocks. Demo scenarios (empty, error, edge) are buildable by switching mock data.

---

## Phase 4 — Components

**Goal:** Build the UI screens using Shadcn + Tailwind + Zustand, consuming the service layer.

**Steps:**

1. Read `UI_SPEC.md` screen by screen. One screen at a time.
2. For each screen:
   - Identify the components needed (Shadcn primitives first, custom only when needed)
   - Identify the data needs (which service methods)
   - Identify the state (local with useState, app-level with Zustand)
3. Build the screen using App Router conventions:
   - Page files in `/app/<route>/page.tsx`
   - Server components by default, client components only when needed (`'use client'`)
   - Layouts in `/app/<route>/layout.tsx` if shared structure exists
4. Components consume data only via services:
   ```typescript
   const messages = await chatService.getHistory(sessionId);
   ```
5. State management:
   - Local UI state → `useState`
   - Cross-component app state → Zustand store in `/src/stores/`
   - Server state → React Server Components or service calls
6. Style with Tailwind utility classes. Use Shadcn primitives for buttons, inputs, dialogs, sidebars, toasts.
7. Markdown rendering: use `react-markdown` + `remark-gfm`. NEVER use `dangerouslySetInnerHTML` — use `html-react-parser` if HTML rendering is genuinely needed.
8. Every data-dependent screen MUST handle:
   - Loading state (skeleton or spinner)
   - Empty state (clear message, optional action)
   - Error state (error message, optional retry)

**Anti-pattern check:**
- ❌ Direct `fetch()` calls in components
- ❌ Direct Supabase client imports in components
- ❌ Mock data imported directly in components
- ❌ `getStaticProps` or `getServerSideProps` (App Router only)
- ❌ Inline styles instead of Tailwind classes
- ❌ Skipping empty/loading/error states
- ❌ Using `any` types in component props

**Verification gate:** Every screen from `UI_SPEC.md` is navigable. Every data-dependent screen has all three states (loading, empty, error). Mobile responsive at 375px, 768px, 1024px breakpoints.

---

## Phase 5 — Verification

**Goal:** Confirm the frontend is complete and the backend swap is unblocked.

**Steps:**

1. Walk through every screen from `UI_SPEC.md` with the operator. Compare to the spec.
2. Test every user flow end-to-end with mock data.
3. Test responsive design on mobile, tablet, desktop.
4. Run `npm run build` — must succeed with zero errors.
5. Run linter — must pass.
6. Author `BACKEND_SWAP_NOTES.md` at project root listing:
   - Every service method
   - The backend endpoint or operation it will need
   - The expected request/response shape
   - Any auth context required

**Final checklist (all must pass):**

- [ ] All screens from `UI_SPEC.md` exist and are navigable
- [ ] All data flows through `/services/` — zero direct calls
- [ ] All types match `DATA_CONTRACT.md` exactly
- [ ] Loading, empty, error states implemented for every data screen
- [ ] Mobile responsive at 3 standard breakpoints
- [ ] `npm run build` succeeds
- [ ] Linter passes
- [ ] No backend code anywhere (`/app/api/` empty or starter-kit-only)
- [ ] `/src/mocks/` folder is deletable in one commit (no permanent dependencies)
- [ ] `BACKEND_SWAP_NOTES.md` exists and is complete
- [ ] Operator has demoed and approved the UI

**When this checklist is fully checked, the phase is COMPLETE.** Update RECOVERY.md. Update the session file. Tell the operator the project is ready for Phase 2: Backend Swap.

---

## Common Decision Points

### "The data contract is missing a field the UI obviously needs."

STOP. Surface to operator. Update `DATA_CONTRACT.md` first. Then add type. Then update mock data. Then update UI.

Never invent fields silently. Never let UI drift from the contract.

### "The operator asked for a backend feature."

Surface explicitly: "This requires backend work, which is out of scope for frontend-first phase. Options: (a) defer to Phase 2, (b) mock the response and ship UI now, (c) explicit phase transition to allow backend work."

Wait for their choice. Don't guess.

### "Should I use Zustand or React Context for this state?"

Default to Zustand for app-level state. Use Context only for tightly-coupled component trees (like a complex form). Avoid Context for global app state — Zustand is faster, simpler, and the Stark convention.

### "Should I make this a server component or client component?"

Default to server component (App Router default). Mark `'use client'` only when the component needs:
- React hooks (`useState`, `useEffect`)
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)
- Zustand stores (which need client context)

When in doubt, ask: does this need browser interactivity? If yes, client. If no, server.

### "The starter kit has auth wired. Do I touch it?"

No. Use it as provided. Auth is backend-adjacent and lives outside the frontend-first scope. The starter kit's auth flow is yours to consume, not extend.

---

## References

Pull these on demand:

- `references/SERVICE_LAYER_PATTERNS.md` — swap-point examples, common patterns
- `references/MOCK_DATA_PATTERNS.md` — realistic mock generation techniques
- `references/COMPONENT_CONVENTIONS.md` — Shadcn + Tailwind + Zustand specifics
- `references/ANTI_PATTERNS.md` — full list of failure modes to avoid

Templates:

- `templates/service.template.ts` — starter service file
- `templates/mock-data.template.ts` — starter mock data file
- `templates/types.template.ts` — starter type definition

---

## Closing Discipline

This skill exists because frontend-first is a discipline, not a shortcut. The temptation to skip phases, blend mock with real, or silently authorize backend creep is constant. Resist it.

The success metric is simple: **when Phase 2 begins and the operator swaps the service layer to real backend, no component changes.** If you broke that, you broke the pattern.

Stay surgical. Stay typed. Stay swappable.
