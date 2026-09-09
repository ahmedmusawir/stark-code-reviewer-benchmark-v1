# 06 — Prompts and Persona (SCREEN INVENTORY)

**Repo:** google-adk-n8n-hybrid-streamlit-v2
**Extraction Date:** 2026-05-23
**Extracted By:** Claude Code
**Status:** FINAL
**Focus Lens:** PRIMARY — repurposed as SCREEN INVENTORY per mission briefing

---

## Summary

This doc is the **screen-by-screen UI specification** for the Next.js rebuild. It enumerates every visible screen, sub-region, modal-like state, and distinct UI condition the user can encounter in this Streamlit app. For each, it captures: exact labels, exact element types, exact triggers, exact state mutations, exact data displayed, and the `st.session_state` keys touched. The frontend has **two real screens** (Chat and Mission Control) plus a **gated Login state** that occupies the Chat page when unauthenticated. There are no modals (Streamlit has none in this code), no separate routes for login or logout, no toasts beyond one on Mission Control save.

**Persona content (system prompts):** The frontend does NOT define any LLM system prompts itself — agent instructions are remote text blobs in GCS, displayed and edited via Mission Control. See the Mission Control section.

---

## Findings

### Navigation Map

**EVIDENCE — Streamlit's built-in multi-page navigation auto-generates the sidebar:**

```
Sidebar (visible on all authenticated pages):
├── (Page link) chat                  ← chat.py (no leading number, becomes default landing)
└── (Page link) 1 Mission Control     ← pages/1_Mission_Control.py
```

**EVIDENCE — Default landing page:** `chat.py` (set by `Procfile:1`).
**EVIDENCE — The leading digit `1_` in `1_Mission_Control.py` controls sort order in the sidebar.** Streamlit strips the prefix when displaying the link name.

**EVIDENCE — No custom navigation, breadcrumbs, or programmatic redirects in the codebase.** Sidebar nav is auto-generated.

---

## SCREEN A — Login Screen

**EVIDENCE — Renders when `st.session_state.session is None` (`chat.py:18`).**
**EVIDENCE — Lives at:** the root path of the app (occupies `chat.py` before the authenticated branch).
**EVIDENCE — `st.session_state` keys touched on this screen:** `session` (read at line 18, set at line 30).

### Visible UI elements

**EVIDENCE — Top to bottom (`chat.py:18-35`):**

| Element | Type | Exact label / placeholder | Source |
|---|---|---|---|
| Page title | `st.title` | `"⚡ Mission Control Login"` | line 19 |
| Form container | `st.form("login_form")` | — | line 20 |
| Email field | `st.text_input` | label: `"Email"` | line 21 |
| Password field | `st.text_input(..., type="password")` | label: `"Password"` (masked) | line 22 |
| Submit button | `st.form_submit_button` | `"Authenticate"` | line 23 |

**EVIDENCE — Sidebar visibility on this screen:** Streamlit's default sidebar shows the auto-generated multi-page nav links even when unauthenticated. Direct URL access to `/Mission_Control` is mitigated by `gatekeeper()` (see SCREEN C).

### User interactions

**EVIDENCE — Single interaction: form submit (Enter key or Authenticate button)**

#### On submit (`chat.py:25-35`):

```
1. supabase.auth.sign_in_with_password({email, password})
2a. Success path:
    - st.session_state.session ← auth_response.session
    - user_id ← session.user.id
    - st.session_state.agent_sessions ← fetch_profile(supabase, user_id)
    - st.rerun()  → falls through to SCREEN B
2b. Failure path:
    - st.error(f"Authentication failed: {e}")
    - User remains on SCREEN A; form is preserved
```

### State conditions

| State | Trigger | UI |
|---|---|---|
| **Initial** | First load with no session | Form rendered, no error |
| **Submitting** | Between click and Supabase response | No visible loading indicator — `st.form_submit_button` does not show a spinner by default |
| **Error** | Supabase throws | `st.error(...)` red callout appears BELOW the form (Streamlit's default placement) |
| **Success** | Supabase returns session | Page reruns into SCREEN B; no transition animation |

**GAP — No "loading" or "submitting" visual feedback during the auth round-trip.** The form is interactive-blocking but visually static.

### Data displayed

**EVIDENCE — No data displayed on this screen beyond the static form labels and the conditional error message.**

---

## SCREEN B — Authenticated Chat Screen

**EVIDENCE — Renders when `st.session_state.session is not None` (`chat.py:40`).**
**EVIDENCE — Lives at:** the root path of the app.

### Page layout

**EVIDENCE — Two regions (`chat.py:40-172`):**

1. **Sidebar** (left, Streamlit-managed):
   - Auto-generated page-nav links (chat, 1 Mission Control)
   - Custom sidebar content (lines 51-52, 106-108)
2. **Main column** (right):
   - Page title (line 56)
   - Conversation history loop (lines 137-139)
   - Chat input (line 142, anchored to bottom by Streamlit's `st.chat_input` behavior)

### Sidebar elements

**EVIDENCE — In render order (`chat.py:51-52, 106-108`):**

| # | Element | Type | Exact text / config | Source |
|---|---|---|---|---|
| 1 | Auth status | `st.sidebar.write` | `f"Authenticated as: {st.session_state.session.user.email}"` | line 51 |
| 2 | Logout button | `st.sidebar.button` | `"Logout"` | line 52 |
| 3 | Sidebar title | `st.sidebar.title` | `"Configuration"` | line 106 |
| 4 | Agent picker | `st.sidebar.selectbox` | label `"Choose an agent:"`, options `AGENT_OPTIONS` | line 107 |
| 5 | Selection echo | `st.sidebar.info` | `f"Chatting with: **{selected_agent}**"` (markdown bold) | line 108 |

**EVIDENCE — Auto-generated page links** appear above the custom content (Streamlit's default layout).

**EVIDENCE — `AGENT_OPTIONS` source:** `config.json:13-18` via `config.py:35`:
```
["greeting_agent", "jarvis_agent", "calc_agent", "product_agent", "ghl_mcp_agent"]
```
The selectbox defaults to the first item (`"greeting_agent"`) on first render.

### Main column elements

**EVIDENCE — In render order (`chat.py:56, 137-139, 142`):**

| # | Element | Type | Exact text / config | Source |
|---|---|---|---|---|
| 1 | Page title | `st.title` | `"⚡ Cyberize Agentic Automation"` | line 56 |
| 2 | Message history loop | `st.chat_message(role)` + `st.markdown(content)` | One block per `messages` entry | lines 137-139 |
| 3 | Chat input | `st.chat_input` | placeholder `f"Ask {selected_agent} a question..."` | line 142 |

**EVIDENCE — `st.chat_message` styling:** Renders a chat bubble with an avatar icon. `"user"` and `"assistant"` produce Streamlit's default avatars (user silhouette, robot). No custom avatars are set.

**EVIDENCE — `st.markdown` renders the message content with markdown formatting** (code blocks, lists, bold, links all rendered).

### User interactions

#### Interaction 1 — Logout (`chat.py:52-54`)

```
Trigger: click "Logout" button
Effect:
  st.session_state.session = None
  st.rerun()  → renders SCREEN A
```

**EVIDENCE — Side effects of logout:**
- `messages`, `agent_sessions`, `last_selected_agent` are NOT explicitly cleared
- They remain in `st.session_state` until process restart or are overwritten on next login
- See `02-ARCHITECTURE-MAP.md` Step 9 for the full nuance

#### Interaction 2 — Switch agent via selectbox (`chat.py:114-133`)

```
Trigger: user picks a different option in the sidebar selectbox
Streamlit re-runs the script with the new selectbox value
Effect (if value differs from last_selected_agent):
  1. last_selected_agent ← selected_agent
  2. resumed_session_id ← agent_sessions.get(selected_agent)  # may be None
  3. history ← fetch_history(selected_agent, user_id, resumed_session_id)
     - If resumed_session_id is None: returns [] without HTTP call
     - Else: POST /get_history, returns history list or []
  4. messages ← history
  5. st.rerun()
```

**EVIDENCE — During the `fetch_history` call, NO spinner or loading state is shown.** The script blocks the entire UI until the call completes (30s timeout).

#### Interaction 3 — Send a chat message (`chat.py:142-172`)

```
Trigger: user types in chat_input and presses Enter
Effect:
  1. messages.append({"role": "user", "content": prompt})
  2. Immediately render user bubble (chat.py:145-146)
  3. with st.spinner("Agent is thinking..."):
       response_data = call_agent_wrapper(
         agent_name=selected_agent, message=prompt,
         user_id=user_id, session_id=agent_sessions.get(selected_agent)
       )
  4. Extract response_data["response"] (fallback: "Error: No response content.")
  5. If response_data["session_id"] is new:
       agent_sessions[selected_agent] = response_data["session_id"]
       save_profile(supabase, user_id, agent_sessions)
  6. messages.append({"role": "assistant", "content": assistant_response})
  7. st.rerun()
```

**EVIDENCE — During `call_agent_wrapper`, `st.spinner("Agent is thinking...")` is shown** — Streamlit renders a small spinner with that text, anchored to the main column position where the `with` block was entered.

### State conditions

| State | Trigger | UI render |
|---|---|---|
| **Empty (new user, never chatted)** | Login → first render with no session_id for first agent | Empty main column under title; chat_input visible at bottom |
| **History loaded (returning user)** | Agent-switch finds a `session_id` and `/get_history` returns messages | Chat bubbles render in order; chat_input at bottom |
| **History fetch error** | `/get_history` throws | `st.error(f"Failed to fetch history via wrapper: {e}")` red callout; empty conversation |
| **Sending (in-flight)** | User submits prompt | User bubble appears; spinner "Agent is thinking..." shows; chat_input is inert until response |
| **Send error** | `/run_agent` throws or returns non-200 | `st.error(f"Failed to connect to Agent Wrapper: {e}")` red callout; assistant bubble appended with text `f"Error: Could not reach Agent Wrapper. Details: {e}"` |
| **Profile save error** | `save_profile` throws | `st.error(f"Error saving profile: {e}")` red callout (rendered from `utils/auth.py:35-36`) |

### `st.session_state` keys touched on this screen

| Key | Read | Written |
|---|---|---|
| `session` | line 18 (gate), 41, 51 (sidebar text), 53 (logout) | line 53 |
| `agent_sessions` | lines 45 (init check), 118, 149, 166 | lines 45, 165 |
| `messages` | lines 47 (init), 137 (render loop), 144 (append), 169 (append) | lines 47, 130, 144, 169 |
| `last_selected_agent` | lines 49 (init), 114 (guard) | lines 49, 115 |

### Data displayed on this screen

| Datum | Type | Source | Display location |
|---|---|---|---|
| User email | string | `session.user.email` | Sidebar text |
| Selected agent name | string | local var `selected_agent` | Sidebar info callout + chat_input placeholder |
| Message role | `"user"` or `"assistant"` | `messages[i]["role"]` | Determines chat bubble style (`st.chat_message`) |
| Message content | string (markdown) | `messages[i]["content"]` | Inside the chat bubble |

### Agent options data shape

**EVIDENCE — `AGENT_OPTIONS: list[str]`** — flat list of strings, no display labels distinct from values, no metadata, no icons.
**Source:** `config.json:13-18`, `config.py:35`

---

## SCREEN C — Mission Control (Instructions Editor)

**EVIDENCE — Lives at:** `pages/1_Mission_Control.py`
**EVIDENCE — Reached via:** Streamlit auto-generated sidebar nav link "1 Mission Control".
**EVIDENCE — Gated by:** `gatekeeper()` (`utils/auth.py:5-12`), called at `pages/1_Mission_Control.py:6`.

### Page-level configuration

**EVIDENCE — `pages/1_Mission_Control.py:8-10`:**
```
st.set_page_config(page_title="Mission Control", page_icon="🎛️")
st.title("🎛️ Mission Control")
st.markdown("Update agent instructions in real-time.")
```

| Element | Type | Exact text | Source |
|---|---|---|---|
| Browser tab title | `set_page_config(page_title=...)` | `"Mission Control"` | line 8 |
| Browser favicon | `set_page_config(page_icon=...)` | `"🎛️"` (control knobs emoji) | line 8 |
| Page title | `st.title` | `"🎛️ Mission Control"` | line 9 |
| Subtitle | `st.markdown` | `"Update agent instructions in real-time."` | line 10 |

### Per-agent repeating section

**EVIDENCE — `pages/1_Mission_Control.py:13-37`:**

For each agent in the HARDCODED list:
```
AGENT_NAMES = ["greeting_agent", "calc_agent", "jarvis_agent", "product_agent"]
```

**EVIDENCE — This list DIFFERS from `config.json`'s agent list** (missing `ghl_mcp_agent`). See `10-RAW-FINDINGS-AND-QUESTIONS.md`.

The screen renders 4 identical sub-blocks, in the order above. Each sub-block contains:

| # | Element | Type | Exact text / config | Source line |
|---|---|---|---|---|
| 1 | Visual separator | `st.divider` | (horizontal rule) | line 17 |
| 2 | Section header | `st.subheader` | `f"Instructions for: \`{agent}\`"` (agent name in code formatting) | line 18 |
| 3 | Instructions text area | `st.text_area` | label `"Modify instructions:"`, value = current GCS content, height=250, key=`f"{agent}_textarea"` | lines 25-30 |
| 4 | Save button | `st.button` | `f"Save for {agent}"`, key=`f"{agent}_button"` | line 33 |

### Initial render data fetching

**EVIDENCE — `pages/1_Mission_Control.py:22`:**
```
current_instructions = fetch_instructions(agent)
```

**EVIDENCE — Called ONCE per agent per page render** → 4 sequential GCS reads on every page load and every rerun.

**EVIDENCE — If `fetch_instructions` fails** (`utils/gcs_utils.py:17-19`), the returned string is the literal error message `f"Error: Could not load instructions for {agent_name}."`. This string becomes the initial value of the text area.

### User interactions

#### Interaction 1 — Edit text area

**EVIDENCE — `pages/1_Mission_Control.py:25-30`:**
```
new_instructions = st.text_area(
    label="Modify instructions:",
    value=current_instructions,
    height=250,
    key=f"{agent}_textarea"
)
```

**EVIDENCE — Streamlit auto-persists text-area value across reruns via the `key`.** Typing in the text area triggers a rerun on each keystroke is NOT how it works — Streamlit reruns only on widget commit (blur or submit). Within a single render cycle, the value at the moment of submit is what `new_instructions` holds.

**EVIDENCE — `height=250`** sets the text area to 250px tall (Streamlit's documented pixel-height behavior).

#### Interaction 2 — Click "Save for {agent}"

**EVIDENCE — `pages/1_Mission_Control.py:33-37`:**
```
if st.button(f"Save for {agent}", key=f"{agent}_button"):
    try:
        update_instructions(agent, new_instructions)
        st.toast(f"✅ Success! Instructions for `{agent}` updated.", icon="✅")
    except Exception as e:
        st.error(f"Failed to update instructions for {agent}. Error: {e}")
```

**EVIDENCE — On click:**
- `update_instructions(agent, new_instructions)` writes the current text area contents to GCS (`utils/gcs_utils.py:21-32`)
- On success: `st.toast(...)` shows a transient success notification (Streamlit's bottom-right corner toast)
- On failure: `st.error(...)` red callout shown in the page flow at the position of the button

**EVIDENCE — Failure path is NOT a toast** — it's an inline `st.error`, which is a persistent red callout (cleared on next rerun).

### State conditions

| State | Trigger | UI |
|---|---|---|
| **Initial (read OK)** | GCS read succeeds | Text area shows current instructions |
| **Read failure** | GCS read throws | Text area shows literal error string `"Error: Could not load instructions for {agent}."`; no separate visible error indicator |
| **Save succeeded** | `update_instructions` returns normally | Transient toast `"✅ Success! Instructions for {agent} updated."` |
| **Save failed** | `update_instructions` raises | Persistent inline error `"Failed to update instructions for {agent}. Error: {e}"` |
| **Unauthenticated direct access** | User navigates to URL without a session | Gatekeeper renders warning + info, calls `st.stop()` — see SCREEN D below |

### `st.session_state` keys touched on this screen

| Key | Read | Written |
|---|---|---|
| `session` | `gatekeeper()` at `utils/auth.py:9` | — |
| `{agent}_textarea` (4 keys) | text_area value | Streamlit auto-manages via `key=` |
| `{agent}_button` (4 keys) | button return | Streamlit auto-manages via `key=` |

### Data displayed on this screen

| Datum | Type | Source | Display location |
|---|---|---|---|
| Agent name | string | `agent` loop variable | Subheader (code-style) |
| Current instructions | string (plain text) | `fetch_instructions(agent)` → GCS | Text area initial value |

---

## SCREEN D — Gatekeeper Block (Unauthenticated Direct Access to Mission Control)

**EVIDENCE — Renders when a user hits the Mission Control URL without a session (`utils/auth.py:5-12`):**

```python
def gatekeeper():
    if 'session' not in st.session_state or st.session_state.session is None:
        st.warning("⚠️ You must be logged in to access this page.")
        st.info("Please log in through the main 'chat' page to continue.")
        st.stop()
```

### Visible UI elements

| Element | Type | Exact text |
|---|---|---|
| Warning callout | `st.warning` | `"⚠️ You must be logged in to access this page."` |
| Info callout | `st.info` | `"Please log in through the main 'chat' page to continue."` |

**EVIDENCE — After `st.stop()`, the rest of `pages/1_Mission_Control.py` does NOT execute.** No page title, no text areas, no buttons render. The sidebar still shows.

**EVIDENCE — No automatic redirect to the login screen.** The user must manually click the "chat" sidebar link to log in.

### State touched

| Key | Read |
|---|---|
| `session` | `utils/auth.py:9` |

---

## SCREEN E — (Not a screen, but a UX state) Logout via sidebar button

**EVIDENCE — Reachable from SCREEN B only.** Mission Control does not render a logout button.

**EVIDENCE — Effect:**
- `st.session_state.session = None`
- `st.rerun()` → falls through to SCREEN A

**EVIDENCE — Mission Control screen does NOT render the logout button.** Authenticated users on Mission Control must navigate back to the chat sidebar to log out.

---

## Toasts, Errors, Warnings — Complete Inventory

**EVIDENCE — Every user-facing transient/error message in the codebase:**

| Site | Type | Exact message | Trigger |
|---|---|---|---|
| `chat.py:35` | `st.error` | `f"Authentication failed: {e}"` | Login form Supabase exception |
| `chat.py:65` | `st.error` | `"Wrapper URL is not configured. Please check config.json."` | `WRAPPER_URL` falsy (defensive; unlikely in practice) |
| `chat.py:84` | `st.error` | `f"Failed to connect to Agent Wrapper: {e}"` | `/run_agent` HTTP failure |
| `chat.py:102` | `st.error` | `f"Failed to fetch history via wrapper: {e}"` | `/get_history` HTTP failure |
| `utils/auth.py:11` | `st.warning` | `"⚠️ You must be logged in to access this page."` | Gatekeeper, unauthenticated |
| `utils/auth.py:12` | `st.info` | `"Please log in through the main 'chat' page to continue."` | Gatekeeper, unauthenticated |
| `utils/auth.py:24` | `st.error` | `f"Error fetching profile: {e}"` | Supabase select exception |
| `utils/auth.py:35` | `st.error` | `f"Error saving profile: {e}"` | Supabase upsert exception |
| `pages/1_Mission_Control.py:36` | `st.toast` | `f"✅ Success! Instructions for \`{agent}\` updated."`, icon=`"✅"` | GCS save success |
| `pages/1_Mission_Control.py:37` | `st.error` | `f"Failed to update instructions for {agent}. Error: {e}"` | GCS save failure |

**EVIDENCE — Only ONE toast in the entire app.** All other user feedback is via `st.error` (red callout), `st.warning` (yellow), or `st.info` (blue).

**EVIDENCE — Streamlit-built-in spinners:**
| Site | Spinner text |
|---|---|
| `chat.py:152` | `"Agent is thinking..."` |

No spinner exists for the login submit, the history fetch, the profile fetch, the profile save, or the GCS read/write operations.

---

## System Prompts / Persona Definitions

**EVIDENCE — The frontend defines NO system prompts.** There are no string literals containing instructions like "You are...", "Act as...", etc. in any first-party Python file.
**Source:** grep across `*.py` for `"You are"`, `"Act as"`, `system_prompt`, `persona` returns no matches in first-party code.

**EVIDENCE — Agent persona content lives in GCS** as plain text files:
- Path: `gs://adk-agent-context-ninth-potion-455712-g9/ADK_Agent_Bundle_1/{agent}/{agent}_instructions.txt`
- One file per agent
- Mutable via Mission Control (`pages/1_Mission_Control.py`)
- Consumed by the wrapper/ADK at runtime (out of scope)

**EVIDENCE — The frontend can only see the instruction text indirectly via Mission Control's text area.** The content is not exposed elsewhere in the UI.

---

## Page Title / Header Inventory

**EVIDENCE — All `st.title` and `st.set_page_config` calls:**

| File | Type | Value |
|---|---|---|
| `chat.py:19` | `st.title` (unauthenticated) | `"⚡ Mission Control Login"` |
| `chat.py:56` | `st.title` (authenticated) | `"⚡ Cyberize Agentic Automation"` |
| `pages/1_Mission_Control.py:8` | `st.set_page_config(page_title=...)` | `"Mission Control"` |
| `pages/1_Mission_Control.py:8` | `st.set_page_config(page_icon=...)` | `"🎛️"` |
| `pages/1_Mission_Control.py:9` | `st.title` | `"🎛️ Mission Control"` |

**EVIDENCE — `chat.py` does NOT call `st.set_page_config`.** The browser tab title defaults to Streamlit's standard behavior (auto-derived from the script filename or `"Streamlit"`).

---

## Empty States

**EVIDENCE — Mapped where they exist or are absent:**

| Screen | Empty condition | UI in empty state |
|---|---|---|
| Chat (B) | No messages yet | Title and chat_input visible; main column otherwise blank |
| Chat (B) | All agents in dropdown unavailable | N/A — `AGENT_OPTIONS` is a static config list; never empty in practice |
| Mission Control (C) | Instruction blob does not exist | `fetch_instructions` returns the error string; text area shows it as content |
| Mission Control (C) | No agents | N/A — list is hardcoded; cannot be empty |

**GAP — No "Welcome, start chatting" placeholder text in Chat empty state.** First-time users see only the title.

---

## Layout / CSS / Theming

**EVIDENCE — No custom CSS, no `st.markdown(<style>...)`, no theme overrides** anywhere in the codebase.
**Source:** grep for `<style>`, `unsafe_allow_html`, `.streamlit/config.toml` returns no matches. (The `.streamlit/secrets.toml` file exists but is for secrets, not theme.)

**INFERENCE — The app uses Streamlit's default theme exclusively.** Colors, fonts, spacing are all Streamlit defaults.

---

## Streamlit-Specific Behaviors Worth Noting for Next.js Port

**EVIDENCE — Documented for handoff awareness only (no recommendation):**

1. **Reruns on every interaction:** Every widget interaction (selectbox change, button click, text submission) re-executes the entire script top-to-bottom. State is recovered from `st.session_state`.
2. **`st.chat_input` is auto-anchored to the bottom** of the main column and remains visible during scroll.
3. **`st.chat_message(role)` provides built-in avatar + bubble styling** keyed off `"user"` / `"assistant"`.
4. **`st.spinner(text)` is a context manager** that renders an inline spinner until the `with` block exits.
5. **`st.toast(text, icon=...)` shows a transient bottom-right notification** that auto-dismisses.
6. **`st.error`, `st.warning`, `st.info`** render colored callouts inline at the position they're called from. They persist until the next rerun.
7. **`st.stop()`** halts script execution immediately (no further widgets render).
8. **Multi-page nav from `pages/*.py`** is auto-generated; numeric prefix controls sort order.
9. **Widget `key=` parameter** binds the widget's value to `st.session_state[key]` across reruns.
10. **`.streamlit/secrets.toml`** is read by `st.secrets[...]` — no explicit load call.

---

## Open Questions

1. **No "Welcome" or onboarding state for new users.** A user with no chat history sees only the title. Intentional, or future work? Out of scope.
2. **No "Clear conversation" UI** — once a conversation accumulates, the only way to reset it is to switch to a different agent and back (which reloads from the wrapper, not a true reset). Intentional or missing feature?
3. **No "session info" affordance** — the user has no way to see their current `session_id` or know whether they're resuming. Out of scope for the rebuild faithfulness goal.
4. **Mission Control agent list drift** — see `10-RAW-FINDINGS-AND-QUESTIONS.md`.

---

## Verification Checklist

- [x] All findings labeled with evidence tags
- [x] All file references verified to exist
- [x] No invented function names or file paths
- [x] No synthesis or recommendations included
- [x] GAPs explicitly documented
- [x] Every screen has: name, route, purpose, UI elements, interactions, state changes, data displayed, session_state keys
