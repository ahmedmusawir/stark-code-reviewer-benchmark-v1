# Phase 2 — Service Layer Scaffolding

> **Goal:** Author `/src/services/` files with typed method signatures and stub implementations.
> **AI time:** 20-40 min | **Review time:** 10 min
> **Pre-req:** Phase 1 approved

---

## What This Phase Does

The service layer is the **sole swap point** between mocked (Phase 1) and real (Phase 2 of overall project) backends. UI components never bypass it. The signatures defined here lock the contract — they don't change between mock and real.

Service stubs in this phase return type-correct placeholder values. Real mock data wiring happens in Phase 3.

---

## Steps

### Step 1 — Read DATA_CONTRACT.md Section 2

Section 2 defines the four services: authService, chatService, profileService, instructionsService. Each method's signature, return type, and BACKEND_SWAP_NOTES are specified.

### Step 2 — Create Service Files

Create four files in `src/services/`:
- `authService.ts` — REAL implementation using Supabase via starter kit
- `chatService.ts` — STUB returning type-correct placeholders
- `profileService.ts` — STUB returning type-correct placeholders
- `instructionsService.ts` — STUB returning type-correct placeholders

### Step 3 — Author `authService.ts`

This is the ONE real service in Phase 1. Wire it to Supabase via the starter kit's existing client.

Methods:
- `signIn(input: LoginRequest): Promise<User>` — calls Supabase, returns `{id, email}` only
- `signOut(): Promise<void>` — clears client session only (matches Streamlit; no server-side invalidation)
- `getCurrentUser(): User | null` — reads from Supabase session

Reference: `skills/stark-frontend-first/templates/service.template.ts` for the file shape.

### Step 4 — Author The Three Stub Services

For `chatService`, `profileService`, `instructionsService`:

Each method:
1. Has the exact signature from DATA_CONTRACT Section 2
2. Returns `await new Promise(r => setTimeout(r, 200))` for network delay simulation
3. Returns a type-correct placeholder (will be replaced with real mocks in Phase 3)
4. Has a top-of-file BACKEND_SWAP_NOTES comment block per the template

Example placeholder pattern for a method that returns `Message[]`:
```typescript
return [];  // Phase 3 will wire real mock data
```

### Step 5 — Add Service Index

Create `src/services/index.ts` that re-exports the four services. Components import from `@/services` not from individual files.

### Step 6 — Verify Compilation

```bash
npx tsc --noEmit
```

Must exit zero.

### Step 7 — Write Service Contract Tests

Create `src/services/__tests__/services.contract.test.ts` (or per-service test files).

Each method gets a test that:
1. Calls the method with valid input
2. Asserts the return value has the correct shape (use TypeScript-level assertions or runtime shape checks)
3. Catches errors gracefully

These tests will pass with stubs and continue passing when real implementations replace stubs in Phase 3.

Run tests:
```bash
npm test
```

### Step 8 — Phase Completion Report

```
## Phase 2 Complete — Service Layer

### Completed
- Created: src/services/authService.ts (REAL via Supabase)
- Created: src/services/chatService.ts (STUB)
- Created: src/services/profileService.ts (STUB)
- Created: src/services/instructionsService.ts (STUB)
- Created: src/services/index.ts (barrel export)
- Created: src/services/__tests__/services.contract.test.ts

### Verified
- ✅ tsc --noEmit clean
- ✅ All four services match DATA_CONTRACT.md Section 2 signatures
- ✅ authService wired to real Supabase (Phase 1 = auth is the only real integration)
- ✅ Three stub services return type-correct placeholders
- ✅ Contract tests pass (npm test exits zero)
- ✅ BACKEND_SWAP_NOTES present in each service file

### Concerns
- [list any]

### Next Phase
- Phase 3: Mock Data
- Proposed actions:
  - Create src/mocks/data/ with realistic typed data per DATA_CONTRACT Section 3
  - Wire mock data into chatService, profileService, instructionsService

### Awaiting Approval
```

### Step 9 — Update RECOVERY.md and Stop

---

## Verification Gate

- [ ] All four service files exist with correct method signatures
- [ ] authService uses real Supabase (not mocked)
- [ ] Stub services return type-correct placeholders
- [ ] BACKEND_SWAP_NOTES in each file
- [ ] tsc clean
- [ ] Contract tests exist and pass
- [ ] Components do NOT yet exist (correct — they come in Phases 4-6)

---

## Anti-Patterns To Avoid

- ❌ Putting HTTP/fetch logic anywhere outside `/src/services/`
- ❌ Wiring real `chatService` to the actual wrapper in Phase 2 (it's mocked until Phase 2 of overall project)
- ❌ Returning `null` from stubs when contract says non-null
- ❌ Adding methods not in DATA_CONTRACT Section 2
- ❌ Skipping BACKEND_SWAP_NOTES
