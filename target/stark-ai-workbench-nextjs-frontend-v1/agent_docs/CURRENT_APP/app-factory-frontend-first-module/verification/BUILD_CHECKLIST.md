# Build Checklist — Final Verification

> **Used in Phase 7 to verify the build is truly complete.**
> Operator walks through every item.

---

## Pre-Build Checks

- [ ] All 8 phases completed and approved
- [ ] All tests across all phases pass: `npm test`
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Lint clean (if configured): `npm run lint`

---

## Build

- [ ] `npm run build` exits zero
- [ ] No build warnings worth investigating
- [ ] `.next/` (or build output dir) is populated
- [ ] No "module not found" or "type error" messages buried in output

---

## Manual Walkthrough — Login

Run `npm run dev`. Navigate to `/login`.

- [ ] Page renders matching `_design/adk-streamlit-1.png`
- [ ] Gradient strip visible at top
- [ ] Email and Password inputs render correctly
- [ ] Password eye-toggle works
- [ ] "Press Enter to submit form" hint appears when password focused
- [ ] Submit with invalid creds → error Alert appears
- [ ] Submit with valid Supabase creds → redirects to `/chat`

---

## Manual Walkthrough — Chat

After successful login, on `/chat`.

- [ ] Sidebar shows:
  - [ ] "chat" and "Mission Control" nav links
  - [ ] "Authenticated as: <email>" line
  - [ ] Logout button
  - [ ] "Configuration" section title
  - [ ] Agent dropdown labeled "Choose an agent:"
  - [ ] "Chatting with: <agent>" card in blue tint
- [ ] Main column shows:
  - [ ] Title: "⚡ Cyberize Agentic Automation"
  - [ ] Message list area (initially empty for new user)
  - [ ] Chat input anchored to bottom with placeholder "Ask <agent> a question..."
- [ ] Dropdown shows exactly 5 agents (greeting_agent, jarvis_agent, calc_agent, product_agent, ghl_mcp_agent)
- [ ] Selecting different agent triggers history fetch (visible loading indicator)
- [ ] Submitting a message:
  - [ ] User bubble appears immediately
  - [ ] "Agent is thinking..." loading indicator visible
  - [ ] Assistant bubble appears with mocked response
  - [ ] Markdown formatting renders correctly (bold, italic, lists, code)
- [ ] **Critical:** Switch to `ghl_mcp_agent`, send "show me contacts" (or whatever your mock triggers the table response). Verify the contacts table renders as a real HTML table, NOT as raw `| Name | Phone | ...` text.
- [ ] Auto-scroll: send 10 messages, verify list scrolls to bottom
- [ ] Tool-use disclosure pattern renders correctly (if your mock includes it)
- [ ] Logout button redirects to `/login`

---

## Manual Walkthrough — Mission Control

Click "Mission Control" in sidebar (after re-logging in).

- [ ] Page title: "🎛️ Mission Control"
- [ ] Subtitle: "Update agent instructions in real-time."
- [ ] **Exactly 4 agent blocks visible** (NOT 5 — `ghl_mcp_agent` should NOT appear)
- [ ] Order: greeting_agent, calc_agent, jarvis_agent, product_agent
- [ ] Each block has:
  - [ ] Section header with agent name in green-tinted code styling
  - [ ] "Modify instructions:" label
  - [ ] Textarea 250px tall populated with mocked instructions
  - [ ] "Save for <agent>" button
- [ ] Edit greeting_agent's textarea
- [ ] Click Save for greeting_agent
- [ ] Toast appears top-right: "Success! Instructions for `greeting_agent` updated."
- [ ] Toast auto-dismisses after a few seconds
- [ ] (If mock has a failure trigger) Save with failure → Alert appears below button (NOT a toast)

---

## Manual Walkthrough — Auth Gates

- [ ] Logout
- [ ] Try navigating directly to `/chat` URL → redirects to `/login`
- [ ] Try navigating directly to `/mission-control` URL → redirects to `/login`
- [ ] Login again
- [ ] Navigate to `/chat` → loads correctly
- [ ] Navigate to `/mission-control` → loads correctly

---

## Manual Walkthrough — Responsive

In browser dev tools, resize viewport:

- [ ] At 375px (mobile): sidebar collapses to hamburger; main content full width
- [ ] At 768px (tablet): sidebar collapsed icons OR full sidebar; main content adjusts
- [ ] At 1024px (desktop): full sidebar; main content takes remainder
- [ ] Chat input remains accessible at all widths
- [ ] Mission Control blocks stack vertically on mobile

---

## Documentation Checks

- [ ] `BACKEND_SWAP_NOTES.md` exists at project root
- [ ] `RECOVERY.md` shows Phase 7 complete
- [ ] `_project/CLAUDE.md` references are still accurate
- [ ] No TODO comments left in code referencing "Phase 1" work

---

## Cleanup Verification

- [ ] No console.log debug statements left in production code
- [ ] No commented-out code from earlier phases
- [ ] No unused imports (TypeScript or lint should catch these)
- [ ] `/src/mocks/` is self-contained — could be deleted with no impact to non-mock code

---

## Sign-Off

- [ ] Operator (Stark) has walked through every item above
- [ ] Operator approves Phase 1 of overall project as COMPLETE
- [ ] Phase 8 (Retrospective) is now unblocked

🥄
