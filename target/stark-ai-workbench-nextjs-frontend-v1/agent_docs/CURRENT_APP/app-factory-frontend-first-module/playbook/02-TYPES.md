# Phase 1 — Types & Contract

> **Goal:** Author TypeScript types in `/src/types/` that match `DATA_CONTRACT.md` exactly.
> **AI time:** 15-30 min | **Review time:** 10 min
> **Pre-req:** Phase 0 approved

---

## What This Phase Does

Types are the contract. Both the mock implementation and the eventual real backend implementation will satisfy these types. If the types are wrong or incomplete, every subsequent phase drifts.

This phase is fast and high-leverage. Get it right.

---

## Steps

### Step 1 — Read DATA_CONTRACT.md Section 1

Every type in Section 1 must be authored. Read carefully — field optionality, enum string literals, snake_case vs camelCase conventions matter.

### Step 2 — Decide File Layout

Two options, AI picks based on complexity:
- **Single file:** `src/types/index.ts` with all interfaces (good for small projects like Cyberize)
- **Per-entity files:** `src/types/User.ts`, `src/types/Message.ts`, etc. with an `index.ts` barrel

For Run 001 (Cyberize): **single file** is fine. ~12 interfaces, fits in one readable file.

### Step 3 — Author The Types

For each type in DATA_CONTRACT.md Section 1:
1. Match field names exactly (preserve snake_case for wire shapes, camelCase for internal)
2. Match optionality exactly (`?` only when contract says optional)
3. Use string literal unions for enums (no `enum` keyword — Stark convention)
4. Never use `any` — use `unknown` with narrowing if truly unknown
5. Add JSDoc comments referencing the contract section

### Step 4 — Verify Compilation

Run from project root:

```bash
npx tsc --noEmit
```

Must exit zero. Any errors → fix before advancing.

### Step 5 — Verify Coverage

Cross-reference DATA_CONTRACT.md Section 1 against the authored types. Every interface in the contract has a corresponding TypeScript type. Nothing invented. Nothing missing.

### Step 6 — Produce Phase Completion Report

```
## Phase 1 Complete — Types & Contract

### Completed
- Created: src/types/index.ts (or per-entity files)
- Types authored: [list — e.g., Agent, AgentName, User, Message, MessageRole, RunAgentRequest, RunAgentResponse, GetHistoryRequest, GetHistoryResponse, ProfileRow, AgentSessionMap, LoginRequest, LoginResponse, InstructionBlob, AppConfig]

### Verified
- ✅ tsc --noEmit clean
- ✅ Every type from DATA_CONTRACT.md Section 1 represented
- ✅ Field names match contract exactly
- ✅ No `any` types
- ✅ Enum values use string literal unions

### Concerns
- [any ambiguity hit — e.g., "DATA_CONTRACT says session_id is string|null on request, I made it string|null. Confirm correct."]
- [or "None"]

### Next Phase
- Phase 2: Service Layer Scaffolding
- Proposed actions:
  - Create src/services/authService.ts (will use real Supabase)
  - Create src/services/chatService.ts (mock stubs)
  - Create src/services/profileService.ts (mock stubs)
  - Create src/services/instructionsService.ts (mock stubs)

### Awaiting Approval
Ready to proceed to Phase 2? Type "approved" or specify changes.
```

### Step 7 — Update RECOVERY.md

At starter kit project root:

```
# Recovery State
Last phase completed: Phase 1 — Types & Contract
Files created: src/types/index.ts
Pending: Phase 2 approval from operator
Next step: Phase 2 — Service Layer Scaffolding
```

### Step 8 — Stop

Wait for "approved" or correction.

---

## Verification Gate

Operator confirms:

- [ ] `tsc --noEmit` was actually run and exited zero
- [ ] Every type from DATA_CONTRACT.md Section 1 is present in the authored types
- [ ] Field names match contract (especially snake_case wire shapes)
- [ ] No `any` types used
- [ ] No invented fields beyond the contract
- [ ] RECOVERY.md updated

If any item fails, operator corrects before approving.

---

## Anti-Patterns To Avoid

- ❌ Using `enum Foo { ... }` instead of `type Foo = 'a' | 'b'`
- ❌ Renaming `agent_name` to `agentName` in wire-shape types (breaks the contract)
- ❌ Adding fields "for future use"
- ❌ Marking required fields as optional "just in case"
- ❌ Using `any` to avoid wrestling with a complex type — use `unknown` instead
- ❌ Skipping `tsc --noEmit` and assuming it works
