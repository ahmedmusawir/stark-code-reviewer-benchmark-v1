# FIX-001 — Defect Amendment Result (Architect-ruled merge-precedence flip)

_2026-07-18 14:42 executed · logged 14:52 (late — caught by Operator) · Engineer: Claudy_

## The ruling

The original mount-effect merge (`fetched wins per-key`) was wrong while
profileService is mocked: the mock returns SEEDED fake agentSessions, so
phantom ids overwrote the genuine persisted pointer on reload → `getHistory`
queried a nonexistent session → degraded to `[]` → chat evaporated.

## CHANGES MADE

- `src/app/(cyberize)/chat/ChatPageContent.tsx` — merge precedence flipped to
  `{...fetched, ...persisted}`: **persisted wins per-key**, fetched fills gaps.
  Comment at the site states why and that the precedence MUST be revisited when
  profileService goes real (server becomes truth).
- **Test expectations:** none changed — verified by grep that no test asserted
  the old precedence (persist suite is store-only; `ChatPageContent.test.tsx`
  mocks `fetchProfile → {}`, precedence-neutral).
- Doc trail: RETROSPECTIVE.md (amendment section + **BIM-LADDER ITEM**:
  re-evaluate precedence when profileService goes real), session log 14:42
  entry, CHANGELOG line updated, RECOVERY.md updated, execution-result artifact
  (`response_2026-07-18_131303`) amended in place.

## GREEN BOARD (after amendment)

24 suites / 149 tests pass · `tsc --noEmit` clean · `npm run build` clean.
Zero git operations.

## COMMIT (Coordinator's; unchanged)

```
FIX-001: persist agent-to-session pointer to localStorage
```

File list unchanged from `response_2026-07-18_131303_fix001-execution-result.md`
— plus THIS file:

```
src/store/chatStore.ts
src/app/(cyberize)/chat/ChatPageContent.tsx
src/__tests__/chat/chatStore.persist.test.ts
agent_docs/RESPONSES/response_2026-07-18_130047_fix001-preflight-plan.md
agent_docs/RESPONSES/response_2026-07-18_131303_fix001-execution-result.md
agent_docs/RESPONSES/response_2026-07-18_145214_fix001-amendment-result.md
agent_docs/CURRENT_APP/FIX001/RETROSPECTIVE.md
session_2026-07-18.md
CHANGELOG.md
RECOVERY.md
```

## KNOWN CONSEQUENCE (accepted by ruling)

With persisted-wins, seeded mock ids no longer override localStorage in mock
mode either: flipping to mock after a live session shows an empty thread for
live-chatted agents (live id drives the mock lookup). Expected during the mock
spot-check, not a failure.

## MANUAL GATES — still pending Coordinator

F1 (reload → history returns) · F2 (incognito fresh flow) · F4 (localStorage
inspect: map only). Script in `response_2026-07-18_131303` / on-screen 14:4x
message. All automated gates (F3/F5/F6) green.
