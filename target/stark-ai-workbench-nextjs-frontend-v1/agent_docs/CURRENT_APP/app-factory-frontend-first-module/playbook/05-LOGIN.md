# Phase 4 — Login Screen

> **Goal:** Build the Login screen with real Supabase auth wired.
> **AI time:** 30-45 min | **Review time:** 15 min
> **Pre-req:** Phase 3 approved

---

## What This Phase Does

First real user-facing screen. Tests:
- Real Supabase auth integration via starter kit
- Shadcn form primitives (Input, Button, Label, Alert)
- Eye-toggle password pattern (visible in screenshot `adk-streamlit-1.png`)
- Auth error display
- Redirect on success

This is the ONE phase where real backend integration happens. Everything else is mocked.

---

## Steps

### Step 1 — Read UI_SPEC.md Section 3

Section 3 is the Login screen spec. Read all elements, states, interactions, validation rules.

### Step 2 — Reference The Screenshot

Open `_design/adk-streamlit-1.png` (or whatever the operator named it — the login screenshot). The "Press Enter to submit form" hint visible on the password field is a real UX detail to replicate.

### Step 3 — Activate `frontend-design` Skill

The Anthropic frontend-design skill should auto-activate when building UI components. If it doesn't trigger, explicitly invoke its design principles for the form layout.

### Step 4 — Create Files

- `src/app/login/page.tsx` — the route, server component shell that renders LoginForm
- `src/components/auth/LoginForm.tsx` — the actual form, client component (needs hooks)
- `src/components/auth/LoginForm.test.tsx` — unit tests
- (Optional) `src/lib/redirect.ts` — helper for post-auth routing

### Step 5 — Build LoginForm

Per UI_SPEC.md Section 3:

Elements:
- Page title: `⚡ Mission Control Login` (h1, text-3xl, font-bold)
- Card wrapper containing the form
- Email input with Label
- Password input with Label, masked, eye-toggle to reveal
- "Press Enter to submit form" hint (shown when password focused)
- "Authenticate" submit button
- Error Alert (variant=destructive) shown below form on failure

Behavior:
- Submit triggers `authService.signIn({email, password})`
- On success: redirect to `/chat`
- On failure: show Alert with error message
- During submit: button shows loading spinner, inputs disabled

### Step 6 — Write Unit Tests

In `LoginForm.test.tsx`:
- Renders email and password inputs
- Submit button is initially enabled
- Eye toggle changes password input type
- Submitting calls authService.signIn with correct args
- Auth failure shows the error Alert
- Auth success triggers redirect (mock the redirect function)

Run:
```bash
npm test
```

Must pass.

### Step 7 — Verify Compilation And Lint

```bash
npx tsc --noEmit
npm run lint  # if lint script exists in package.json
```

### Step 8 — Manual Verification

Operator should:
1. Run `npm run dev`
2. Navigate to `/login`
3. Verify visual matches screenshot
4. Attempt real Supabase login with valid credentials
5. Verify redirect to `/chat` works (even if Chat page doesn't exist yet — should at least attempt the redirect)
6. Attempt login with invalid credentials
7. Verify error Alert appears

### Step 9 — Phase Completion Report

```
## Phase 4 Complete — Login Screen

### Completed
- Created: src/app/login/page.tsx
- Created: src/components/auth/LoginForm.tsx
- Created: src/components/auth/LoginForm.test.tsx
- [any helpers created]

### Verified
- ✅ tsc --noEmit clean
- ✅ npm test passes (N new tests)
- ✅ Page renders matching screenshot adk-streamlit-1.png
- ✅ Eye-toggle on password works
- ✅ Real Supabase auth succeeds with valid creds (operator verified)
- ✅ Error Alert appears on auth failure (operator verified)
- ✅ Redirect attempted on success

### Concerns
- [list any UI gotchas or auth quirks]

### Next Phase
- Phase 5: Chat Screen (biggest phase)
- Proposed actions:
  - Build AppShell + Sidebar + GradientStrip layout components
  - Build chat page with MessageList, MessageBubble, ChatInput, AgentSelector
  - Create chatStore (Zustand)
  - Tests for each major component

### Awaiting Approval
```

### Step 10 — Update RECOVERY.md and Stop

---

## Verification Gate

- [ ] Login page exists and renders
- [ ] Visual matches screenshot
- [ ] Real Supabase auth works (positive case)
- [ ] Error Alert works (negative case)
- [ ] Eye-toggle on password works
- [ ] Unit tests pass
- [ ] tsc clean
- [ ] Redirect attempted on success

---

## Anti-Patterns To Avoid

- ❌ Mocking the Supabase auth in Phase 1 (auth is REAL — only data backends are mocked)
- ❌ Using `dangerouslySetInnerHTML` for the error message
- ❌ Building the Chat screen here (next phase)
- ❌ Skipping the eye-toggle (it's in the screenshot, faithful conversion required)
- ❌ Custom client-side email/password validation (Streamlit had none, we have none)
