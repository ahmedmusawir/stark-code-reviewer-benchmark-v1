# SERVICE_LAYER_PATTERNS — The Swap Point In Practice

The service layer is the only place mock and real backends meet. This reference documents the patterns that make the swap clean.

---

## The Core Pattern

Every service is an object literal with typed methods. Methods return Promises. Internals can be mock or real — the interface never changes.

```typescript
// /src/services/chatService.ts
import type { Message, AgentResponse } from '@/types';

export const chatService = {
  sendMessage: async (params: {
    agentName: string;
    message: string;
    sessionId?: string;
  }): Promise<AgentResponse> => {
    // Mock implementation today
    // Real implementation tomorrow
    // UI doesn't change either way
  },

  getHistory: async (sessionId: string): Promise<Message[]> => {
    // ...
  },
};
```

---

## Pattern A — In-Service Mock (Simplest)

The mock lives inside the service file. Easy to start, easy to swap.

**Mock phase:**
```typescript
import type { Message } from '@/types';
import { messages as mockMessages } from '@/mocks/data/messages';

export const chatService = {
  getHistory: async (sessionId: string): Promise<Message[]> => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 200));
    return mockMessages.filter(m => m.sessionId === sessionId);
  },
};
```

**Real phase (after swap):**
```typescript
import type { Message } from '@/types';
import { supabase } from '@/lib/supabase';

export const chatService = {
  getHistory: async (sessionId: string): Promise<Message[]> => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data.map(mapRowToMessage);
  },
};
```

**Swap effort:** Edit one file. Components untouched. ✅

---

## Pattern B — Split Mock/Real Files (Cleaner)

Mock and real implementations live in separate files. An index file picks which one to export based on environment.

**Folder structure:**
```
/src/services/
├── chat/
│   ├── chatService.mock.ts
│   ├── chatService.real.ts
│   └── index.ts
└── index.ts
```

**chatService.mock.ts:**
```typescript
import type { Message } from '@/types';
import { messages as mockMessages } from '@/mocks/data/messages';

export const chatService = {
  getHistory: async (sessionId: string): Promise<Message[]> => {
    await new Promise(r => setTimeout(r, 200));
    return mockMessages.filter(m => m.sessionId === sessionId);
  },
};
```

**chatService.real.ts:**
```typescript
import type { Message } from '@/types';
import { supabase } from '@/lib/supabase';

export const chatService = {
  getHistory: async (sessionId: string): Promise<Message[]> => {
    const { data, error } = await supabase.from('messages').select('*').eq('session_id', sessionId);
    if (error) throw error;
    return data;
  },
};
```

**index.ts:**
```typescript
const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

export const chatService = useMocks
  ? (await import('./chatService.mock')).chatService
  : (await import('./chatService.real')).chatService;
```

**Swap effort:** Flip env var. ✅

---

## Pattern C — Wrapper API (For Existing Backends)

When the backend already exists (like the FastAPI wrapper for ADK agents), the "real" implementation calls an HTTP API. The mock simulates the same response shapes.

**Mock:**
```typescript
import type { AgentResponse } from '@/types';

export const chatService = {
  sendMessage: async (params): Promise<AgentResponse> => {
    return {
      response: `[Mock response to: ${params.message}]`,
      session_id: params.sessionId ?? `mock-session-${Date.now()}`,
      agent_name: params.agentName,
      status: 'success',
    };
  },
};
```

**Real:**
```typescript
import type { AgentResponse } from '@/types';

const WRAPPER_URL = process.env.NEXT_PUBLIC_WRAPPER_URL!;

export const chatService = {
  sendMessage: async (params): Promise<AgentResponse> => {
    const response = await fetch(`${WRAPPER_URL}/run_agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_name: params.agentName,
        message: params.message,
        user_id: params.userId,
        session_id: params.sessionId,
      }),
    });
    if (!response.ok) throw new Error(`Wrapper error: ${response.status}`);
    return response.json();
  },
};
```

**Swap effort:** Edit one file, no component changes. ✅

---

## Pattern D — Cookie/LocalStorage State (For Demo Mode)

Sometimes mock data needs to persist across renders for realistic demos (e.g., "I just sent a message and want it to appear in history"). Use a lightweight client store.

```typescript
import type { Message } from '@/types';

// Module-level state for demo mode (resets on full reload)
let demoMessages: Message[] = [];

export const chatService = {
  sendMessage: async (params): Promise<{ response: string; session_id: string }> => {
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: params.message,
      sessionId: params.sessionId ?? 'demo-session',
      createdAt: new Date().toISOString(),
    };
    const assistantMsg: Message = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: `Demo reply to: ${params.message}`,
      sessionId: userMsg.sessionId,
      createdAt: new Date().toISOString(),
    };
    demoMessages.push(userMsg, assistantMsg);
    return { response: assistantMsg.content, session_id: userMsg.sessionId };
  },

  getHistory: async (sessionId: string): Promise<Message[]> => {
    return demoMessages.filter(m => m.sessionId === sessionId);
  },
};
```

**Note:** This pattern is for in-session demos. For cross-reload persistence in demo mode, use localStorage. For cross-device persistence, you need a real backend.

---

## Choosing The Right Pattern

| Situation | Pattern |
|-----------|---------|
| Tiny prototype, single dev | A — In-service mock |
| Multi-screen app with mock/real toggle needed | B — Split files |
| Backend exists already (FastAPI wrapper, etc.) | C — Wrapper API |
| Stakeholders need stateful demo (send → appears) | D — Cookie/LocalStorage |

You can mix patterns in one app. e.g., simple read-only data uses Pattern A, the chat with stateful demo uses Pattern D.

---

## What NEVER Changes

Across all four patterns, the **method signature is invariant**. The same component code works against any pattern.

```typescript
// Always works, regardless of which pattern is active
const messages = await chatService.getHistory(sessionId);
```

If you find yourself changing method signatures between mock and real, you've broken the pattern. The interface is the contract.

---

## Common Mistakes

**Mistake 1: Mock returns `null` where real returns `[]`.**

The interface must match exactly. If real returns an empty array, mock returns an empty array. If real returns `null` on no-results, mock returns `null`. Pick one and be consistent.

**Mistake 2: Mock throws different errors than real.**

If real throws a `SupabaseError`, mock should throw something compatible (or normalize errors at the service boundary so the UI sees a common error type).

**Mistake 3: Mock skips network delay.**

Mock without delay makes loading states untestable. Add `await new Promise(r => setTimeout(r, 200))` to simulate real latency. Stakeholders should see loading states.

**Mistake 4: Mock doesn't simulate failure modes.**

Add a way to trigger errors in mock for testing error states. E.g., a special query value that throws, or a config flag that forces errors.

---

## Service Layer Naming Conventions

- File: `<domain>Service.ts` — `chatService.ts`, `userService.ts`, `agentService.ts`
- Object: same as file, camelCase — `chatService`, `userService`
- Methods: domain-named, verb-first — `sendMessage`, `getCurrentUser`, `updateAgentInstructions`

Avoid:
- HTTP verbs (`postMessage`, `getUsers`) — leak implementation
- CRUD prefixes (`createUser`, `readUser`) — too generic, not domain-named
- Trailing `Async` (`sendMessageAsync`) — all methods are async by default

Prefer:
- `sendMessage` over `postMessage`
- `getCurrentUser` over `fetchCurrentUser`
- `signIn` / `signOut` over `login` / `logout` (Supabase convention)
- `updateInstructions` over `saveInstructions` (matches user intent)
