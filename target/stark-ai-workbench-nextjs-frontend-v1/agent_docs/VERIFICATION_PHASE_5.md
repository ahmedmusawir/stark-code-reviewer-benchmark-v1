# Manual Verification — Phases 5.4 + 5.5 + 6

> Snapshot for Tony, morning of 2026-05-29 (after late-night close).
> Run through these in order; tick each ✅ or note the symptom and skip ahead.
> If something fails: paste the symptom + step number to the next session.
>
> **Updated late 5/28 to also cover Phase 6 (Home Page).** Section 14+ is Phase 6.

## Setup

- [ ] `cd /home/moose/nextjs/adk-agent-harness-nextjs-frontend-v1`
- [ ] `npm run dev`
- [ ] Open `http://localhost:3000/auth` in Chrome

---

## 1. Login + theme defaults

- [ ] Page loads in **DARK** mode by default (no flash of white)
- [ ] Layout matches Phase 4.5: `CYBERIZE` wordmark top, "Welcome back" hero, email + password fields, "Sign in" button, "Need access? Contact your administrator." footer
- [ ] Click sun/moon toggle top-right — flips to **light**
- [ ] Reload — light persists
- [ ] Toggle back to dark; reload — dark persists
- [ ] Try invalid credentials → red inline error appears
- [ ] Log in with a valid Supabase user (any role)

## 2. Mobile responsiveness (Chrome DevTools device toolbar)

Open DevTools → Toggle device toolbar (Cmd/Ctrl+Shift+M).

### At 375 px (iPhone SE)

- [ ] Sidebar **hidden**; thin top bar visible with hamburger icon top-left and CYBERIZE wordmark center
- [ ] Tap hamburger → drawer slides over from left, backdrop dims behind
- [ ] Press Escape → drawer closes
- [ ] Tap backdrop → drawer closes
- [ ] Tap close (X) button inside drawer → drawer closes
- [ ] All buttons feel tappable (not tiny)

### At 768 px (iPad portrait)

- [ ] Sidebar persistent on left, no top bar
- [ ] No hamburger visible

### At 1024 px+ (desktop)

- [ ] Same as 768 — sidebar persistent

## 3. Sidebar (desktop or mobile drawer)

- [ ] `CYBERIZE` wordmark at top
- [ ] If logged in as **admin** or **superadmin**: "Mission Control" link visible above agent list
- [ ] If logged in as **member**: no Mission Control link
- [ ] Five agents listed in order: `greeting_agent`, `jarvis_agent`, `calc_agent`, `product_agent`, `ghl_mcp_agent`
- [ ] Selected agent highlighted (background differs)
- [ ] Bottom: your email (truncated if long), theme toggle, logout icon
- [ ] Click logout → redirects to `/auth`, chat state cleared on next login

## 4. Dark mode legibility (the "not too black" check)

- [ ] Main bg is dark grey (zinc-800) — should feel like ChatGPT, not a black hole
- [ ] User-message pill is slightly lighter than main bg (subtle but visible contrast)
- [ ] Sidebar is slightly darker than main bg (zinc-900 — ChatGPT-inverted pattern)
- [ ] All text readable

## 5. Mission Control gating

- [ ] Logged in as admin/superadmin: click Mission Control link in sidebar → see placeholder page with "Agent instruction editor" + ✅ confirmation text
- [ ] Logged out OR logged in as member: manually URL to `/mission-control` → redirected to `/auth`

## 6. Per-agent content showcases

For each agent, click in sidebar then send any message (e.g., "test"). Verify the AI response shows the distinct format:

- [ ] **greeting_agent** → response includes a fenced text code block (looks like a copyable prompt) with copy icon top-right
- [ ] **jarvis_agent** → response includes a **TypeScript** code block with syntax highlighting + copy icon top-right
- [ ] **calc_agent** → response includes a **Python** code block with syntax highlighting + copy icon
- [ ] **product_agent** → response includes a comparison **table** AND a **numbered list** with bold plan names
- [ ] **ghl_mcp_agent** → response includes the **markdown contacts table** (4-row Name/Email/Phone/Last Activity)

## 7. Per-agent message retention (cross-agent)

- [ ] Click `greeting_agent`, send 2 messages, get 2 responses (4 messages total in thread)
- [ ] Click `jarvis_agent`, send 1 message, get 1 response (2 messages in thread)
- [ ] Click `greeting_agent` again → all 4 previous messages STILL THERE
- [ ] Click `jarvis_agent` again → previous 2 messages STILL THERE

## 8. Action buttons under messages

- [ ] Under any **assistant** message, see 4 icons: Copy / Read Aloud (speaker) / 👍 / 👎
- [ ] On the **LAST** assistant message only, additionally see Regenerate (circular arrow)
- [ ] Under any **user** message, see Copy + Edit (pencil)

For each action:

- [ ] **Copy** (assistant) — icon flips to checkmark, button label "Copied", reverts to "Copy" after 2s
- [ ] **Read Aloud** — browser speaks the message text (turn audio on)
- [ ] **👍 / 👎** — open browser DevTools console; click thumbs → see `[MessageActions] feedback: up` or `down` logged
- [ ] **Regenerate** — click on last assistant message → message replaced with a new response (same agent, same user message re-sent)
- [ ] **Copy** (user) — same flash behavior
- [ ] **Edit** (user) — input pre-fills with that user message; banner appears: "Editing message — submit to replace, Esc to cancel"
- [ ] Submit edit → assistant response replaces; conversation tail truncated to just `(history through edited user) → (new assistant)`
- [ ] Press Escape while editing → cancels, banner gone

## 9. Code-block copy icon

- [ ] Send any message that triggers a code block (Calc or Jarvis or Greeting)
- [ ] Top-right of code block — small "Copy" button visible
- [ ] Click it → text changes to "Copied" briefly
- [ ] Paste into any text editor → exact code text appears

## 10. Plus icon attachment menu

- [ ] In chat input, click the **+ icon** (left side, before textarea)
- [ ] Popup appears with two items: "Upload file" (paperclip) and "Upload image" (picture icon)
- [ ] Click "Upload file" → console logs `[AttachmentMenu] upload file`
- [ ] Click outside popup → closes
- [ ] At 375 px (mobile DevTools) → popup still readable, doesn't overflow viewport

## 11. Auto-grow textarea

- [ ] Type or paste a long multi-line message (15+ lines)
- [ ] Textarea grows to ~12 rows max, then scrolls internally
- [ ] Send button still visible (doesn't get pushed off-screen)

## 12. Copy conversation as Markdown

- [ ] In any chat with messages, see "Copy conversation" button top-right of the message column
- [ ] Click it → "Copied" briefly flashes
- [ ] Paste into a text editor → see the whole thread formatted with `## You` and `## {agent_name}` headers separated by blank lines

## 13. Build + tests baseline

In a second terminal:

- [ ] `npm test` → **18 suites / 115 tests pass**
- [ ] `npm run build` → succeeds (may show a `caniuse-lite is 9 months old` warning — ignore that one)

---

---

## 14. Phase 6 — Home Page (enterprise intranet style)

### Unauthed visit
- [ ] Log out (or open `/` in an incognito window)
- [ ] At `/` (root URL): see
  - `CYBERIZE` wordmark (small uppercase, tracked)
  - Big "Cyberize Agentic Automation" heading
  - "Operate. Configure. Converse." tagline
  - Green-dot "All systems operational" pulsing pill
  - Centered "Sign in" button (dark on light / light on dark — ChatGPT-inverted)
  - "Need access? Contact your administrator." footer note

### Authed as a **member**
- [ ] Log in as a member account; navigate to `/`
- [ ] Hero same as above
- [ ] "Quick launch" section with **2 tiles**:
  - Chat
  - Members Dashboard
  - Profile
  - (3 tiles total, no MC or Admin Portal)
- [ ] Footer shows "signed in as your@email.com"
- [ ] Click Chat tile → navigates to `/chat`
- [ ] Click Profile tile → navigates to `/members-portal/profile`

### Authed as an **admin**
- [ ] Log in as admin; navigate to `/`
- [ ] Quick launch shows **4 tiles**: Chat, Mission Control, Admin Portal, Profile
- [ ] Click Mission Control → navigates to `/mission-control` placeholder
- [ ] Click Admin Portal → navigates to kit's admin portal (working CRUD)

### Authed as **superadmin**
- [ ] Log in as superadmin; navigate to `/`
- [ ] Quick launch shows **5 tiles**: Chat, Mission Control, Admin Portal, Superadmin Portal, Profile
- [ ] Click Superadmin Portal → kit's superadmin portal opens

### Mobile responsive (DevTools)
- [ ] At 375px: tiles stack in 1 column; hero text scales down
- [ ] At 768px: tiles in 2 columns
- [ ] At 1024px+: tiles in 3 columns
- [ ] All tiles tap-friendly (~112px tall min)

### Dark + light
- [ ] Toggle theme (NavbarHome should still have the kit's theme toggler)
- [ ] Both modes: hero text legible, tile borders visible, hover state subtle but visible

### Known cosmetic note (not Phase 6 scope)
- The kit's `NavbarHome` at the top of the public layout still shows the prior project's nav links ("Booking", "Global 404"). That's a separate cleanup task (Phase 7 polish per your earlier "we'll get rid of them later" call). Visible but not blocking.

---

---

## 15. Phase 7 — Mission Control (real content) + palette unification across kit portals

### As admin or superadmin: Mission Control
- [ ] Log in as admin or superadmin
- [ ] Navigate to `/mission-control` (sidebar link or URL)
- [ ] See header: "MISSION CONTROL" wordmark + "Agent instruction editor" + brief subhead
- [ ] See **4 agent instruction blocks** in this order: `greeting_agent`, `calc_agent`, `jarvis_agent`, `product_agent`
- [ ] **`ghl_mcp_agent` is NOT present** (drift preserved per DATA_CONTRACT §4)
- [ ] Each block:
  - Header "Instructions for: `agent_name`" (agent name in green-tinted code style)
  - "Modify instructions:" label
  - Textarea ~250px tall, pre-filled with mock instructions
  - "Save for `agent_name`" button (dark on light / light on dark)
- [ ] Edit instructions in greeting_agent block → click Save → top-right toast: "Saved — Instructions for greeting_agent updated."
- [ ] Open browser DevTools → trigger an error path (e.g., switch chatStore to throw) → inline destructive Alert appears below the save button
- [ ] Mobile (375px): blocks stack vertically, textareas remain usable

### As member: Mission Control gate
- [ ] Log in as member
- [ ] In the sidebar: Mission Control link is **hidden** (members shouldn't see it)
- [ ] Manually URL to `/mission-control` → redirected to `/auth` (admin+ gate working)

### Kit portal palette unification (matches `/chat` dark mode)
- [ ] Toggle to dark mode
- [ ] Navigate to `/admin-portal` (login as admin first) — user cards have `zinc-800` bg, `zinc-600` borders, dark text legible
- [ ] Navigate to `/superadmin-portal` (login as superadmin) — same palette consistency
- [ ] Navigate back to `/chat` — palette matches the portals (no jarring difference)
- [ ] Body background of every page is the new softer dark (`zinc-700` main, not the prior near-black)

### Doctrine confirmation
- [ ] `_project/CLAUDE.md` now contains a "Locked Palette" table with the 11 tokens (main bg, sidebar, card, subtle, border, text-primary, text-muted, primary-button, hover, focus, destructive, success). Future agents will consult this table.

---

## If anything fails

Copy:
1. The item number above (1-13 = Phase 5, 14 = Phase 6, 15 = Phase 7 + palette)
2. What you did (browser, screen size, role you logged in as)
3. The symptom (screenshot helps)
4. Browser console errors if any

Paste into the next session — I'll fix in a hotfix before Phase 8 (Verification + Retrospective).
