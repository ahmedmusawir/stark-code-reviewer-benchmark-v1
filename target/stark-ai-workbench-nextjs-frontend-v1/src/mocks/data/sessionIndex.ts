/**
 * Mock in-memory session index (BIM-004, D8).
 *
 * Mirrors the seeded demo world: the two agents that ship with seeded
 * conversations (greeting + jarvis) each get one index row pointing at the
 * seeded ADK session id, so the session panel shows them in mock mode and
 * click-to-resume loads the seeded history. Reloads wipe (mock semantics).
 */

import type { SessionIndexEntry } from '@/types';
import { seededSessionByAgent } from './messages';

let idCounter = 0;
const mockId = (): string => `mock-row-${++idCounter}`;

const seedRows = (): SessionIndexEntry[] => [
  {
    id: mockId(),
    agent_name: 'greeting_agent',
    adk_session_id: seededSessionByAgent.greeting_agent,
    title: 'Seeded greeting demo',
    created_at: '2026-07-01T10:00:00Z',
    updated_at: '2026-07-01T10:05:00Z',
    archived: false,
  },
  {
    id: mockId(),
    agent_name: 'jarvis_agent',
    adk_session_id: seededSessionByAgent.jarvis_agent,
    title: 'Seeded Jarvis demo',
    created_at: '2026-07-01T11:00:00Z',
    updated_at: '2026-07-01T11:05:00Z',
    archived: false,
  },
];

export let mockSessionIndex: SessionIndexEntry[] = seedRows();

export const newMockRowId = mockId;

export const resetMockSessionIndex = (): void => {
  idCounter = 0;
  mockSessionIndex = seedRows();
};
