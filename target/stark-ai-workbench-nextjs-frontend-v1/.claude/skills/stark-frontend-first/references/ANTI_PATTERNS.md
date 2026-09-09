# ANTI_PATTERNS — Frontend-First Failure Modes

These are the patterns that break the frontend-first discipline. If you catch yourself doing any of them, STOP and surface to the operator.

---

## 1. Direct Backend Calls In Components

❌ **Bad:**
```tsx
// In a component file
const response = await fetch('/api/messages');
const data = await response.json();
```

✅ **Good:**
```tsx
// In a component file
const messages = await chatService.getHistory(sessionId);
```

**Why this matters:** The moment a component knows about HTTP, it's coupled to the backend. The swap from mock to real can no longer be done in one place. The whole point of the service layer collapses.

---

## 2. Importing Mock Data In Components

❌ **Bad:**
```tsx
// In a component file
import { users } from '@/mocks/data/users';
return <UserList users={users} />;
```

✅ **Good:**
```tsx
// In a component file
import { userService } from '@/services';
const users = await userService.getAll();
return <UserList users={users} />;
```

**Why this matters:** Mock data is supposed to be deletable in one commit. If components import directly from `/mocks/`, the swap requires editing every component. The service layer indirection IS the whole point.

---

## 3. Inventing Fields Not In Data Contract

❌ **Bad:**
```typescript
// Data contract says User has { id, email, name }
// In UI work, suddenly:
interface User {
  id: string;
  email: string;
  name: string;
  preferences: { theme: 'dark' | 'light' };  // ← invented
}
```

✅ **Good:**
- Surface to operator: "UI needs a `preferences` field. Should I add it to `DATA_CONTRACT.md`?"
- Wait for approval. Update contract first. Then update types. Then mock. Then UI.

**Why this matters:** Backend work in Phase 2 is built from `DATA_CONTRACT.md`. If the UI invents fields, the backend swap reveals a mismatch and the swap fails.

---

## 4. Supabase Client In Frontend Code

❌ **Bad:**
```tsx
// Anywhere in a component
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(...);
const { data } = await supabase.from('users').select();
```

✅ **Good:**
- Service layer encapsulates Supabase calls (Phase 2)
- Phase 1 (frontend-first) has NO Supabase calls anywhere
- If the starter kit wires Supabase for auth, that's fine — use as-is, don't extend

**Why this matters:** Supabase in components hardcodes the backend choice. If you ever want to swap to a different backend, every component must change.

---

## 5. Skipping Loading/Empty/Error States

❌ **Bad:**
```tsx
const messages = await chatService.getHistory(sessionId);
return (
  <div>
    {messages.map(m => <Message key={m.id} {...m} />)}
  </div>
);
```

✅ **Good:**
```tsx
'use client';
import { useState, useEffect } from 'react';

function ChatHistory({ sessionId }) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    chatService.getHistory(sessionId)
      .then(setMessages)
      .catch(e => setError(e.message));
  }, [sessionId]);

  if (error) return <ErrorState message={error} onRetry={() => /* retry */} />;
  if (messages === null) return <LoadingSkeleton />;
  if (messages.length === 0) return <EmptyState message="No messages yet" />;

  return (
    <div>{messages.map(m => <Message key={m.id} {...m} />)}</div>
  );
}
```

**Why this matters:** Stakeholders judge UI quality by edge states more than happy paths. A polished happy path with broken empty/error states reads as amateur. Production-grade UI handles all three.

---

## 6. Using `any` To Avoid Thinking

❌ **Bad:**
```typescript
function handleResponse(data: any) {
  return data.results.map((r: any) => r.value);
}
```

✅ **Good:**
```typescript
function handleResponse(data: AgentResponse): string[] {
  return data.results.map(r => r.value);
}
```

**Why this matters:** Every `any` is a place where the type contract breaks down. The whole frontend-first pattern depends on types as the contract between mock and real. Erode the types, erode the pattern.

---

## 7. Skipping Plan Mode "Because It's Just Mock Data"

❌ **Bad:** Creating 12 mock data files and 8 service files without entering Plan Mode because "it's just mock data, low risk."

✅ **Good:** Plan Mode for ANY file creation. The discipline matters more than the risk level.

**Why this matters:** Plan Mode isn't about risk. It's about ensuring the operator and you agree on what's about to happen. Skipping it builds the wrong habit. The wrong habit shows up later on high-risk work.

---

## 8. Keeping Mock Infrastructure "Just In Case"

❌ **Bad:** After backend swap, keeping `/mocks/` folder "in case we need to demo offline."

✅ **Good:** After backend swap, `/mocks/` is deleted in one commit. If offline demos are needed later, they can be regenerated from real data captures.

**Why this matters:** Dual systems drift. Mock data and real data diverge over time. The frontend-first pattern only works if the mocks are temporary. Permanent mocks become a liability.

---

## 9. Using `dangerouslySetInnerHTML`

❌ **Bad:**
```tsx
<div dangerouslySetInnerHTML={{ __html: messageContent }} />
```

✅ **Good:**
```tsx
import parse from 'html-react-parser';
<div>{parse(messageContent)}</div>
```

✅ **Better (for markdown):**
```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
<ReactMarkdown remarkPlugins={[remarkGfm]}>{messageContent}</ReactMarkdown>
```

**Why this matters:** Stark convention. `dangerouslySetInnerHTML` is XSS-prone and breaks React's component model. `html-react-parser` is safer. `react-markdown` is even better when the source is markdown.

---

## 10. Using Pages Router Patterns In App Router

❌ **Bad:**
```tsx
export async function getServerSideProps() { ... }
export async function getStaticProps() { ... }
```

✅ **Good:**
```tsx
// In app/page.tsx (server component by default)
export default async function Page() {
  const data = await someService.getData();
  return <View data={data} />;
}
```

**Why this matters:** Next.js 13+ App Router is the only Stark convention. Pages Router patterns are noise from older tutorials. Don't mix paradigms.

---

## 11. Building Backend "Just To Test"

❌ **Bad:** "Let me just wire up the real Supabase call for this one endpoint to verify the data flow works."

✅ **Good:** Surface to operator: "I want to verify the data flow. Options: (a) keep mock and verify with mock data, (b) explicit phase transition to wire one real endpoint, (c) defer verification to Phase 2."

**Why this matters:** "Just to test" is how scope creeps. The frontend-first phase has hard boundaries. Crossing them, even once, breaks the discipline.

---

## 12. Mock Data With "Lorem Ipsum" Or "Test 1, Test 2"

❌ **Bad:**
```typescript
export const messages = [
  { id: '1', text: 'Lorem ipsum dolor sit amet', author: 'User 1' },
  { id: '2', text: 'Test message 2', author: 'User 2' },
];
```

✅ **Good:**
```typescript
export const messages = [
  { id: 'msg-001', text: 'Hey, can you pull up the Q3 projections?', author: 'tony@stark.com' },
  { id: 'msg-002', text: 'On it, sir. Loading the dashboard now.', author: 'jarvis_agent' },
];
```

**Why this matters:** Stakeholders demo with mock data. Lorem ipsum signals "not real yet." Realistic mock data signals "this is what your app will feel like." The latter gets approved faster.

---

## 13. Forgetting `BACKEND_SWAP_NOTES.md`

❌ **Bad:** Declaring frontend-first complete without documenting what the backend needs to provide.

✅ **Good:** `BACKEND_SWAP_NOTES.md` exists at project root and lists every service method, its expected request shape, response shape, and auth context.

**Why this matters:** Phase 2 (Backend Swap) starts cold. The Phase 2 engineer (you, the operator, or a different agent) needs a map. Without the swap notes, the backend has to be reverse-engineered from the services, which wastes hours.

---

## 14. Mobile Responsiveness As An Afterthought

❌ **Bad:** Building desktop-first, then "we'll fix mobile later."

✅ **Good:** Test every screen at 375px, 768px, and 1024px as you build. Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`) are designed for this.

**Why this matters:** Stakeholders test on phones. "Looks great on desktop" is half the story.

---

## 15. Service Methods Named After HTTP Verbs

❌ **Bad:**
```typescript
chatService = {
  postMessage: ...,
  getMessages: ...,
  putMessage: ...,
};
```

✅ **Good:**
```typescript
chatService = {
  sendMessage: ...,
  getHistory: ...,
  editMessage: ...,
};
```

**Why this matters:** HTTP verbs leak the implementation. The component shouldn't care that "send" is a POST. Domain-named methods read like English and survive backend changes.

---

If you find a new anti-pattern during a project run, add it here. The skill grows from real evidence.
