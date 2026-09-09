/**
 * Mock user profile rows (agent_sessions maps).
 *
 * Phase 3: in-memory mutable map. `profileService.saveProfile` writes here.
 * Reloads wipe state — acceptable for demo. If Phase 5 chat store needs
 * cross-reload persistence, hydrate via Zustand's `persist` middleware at the
 * store layer, not here.
 *
 * @see _project/DATA_CONTRACT.md §1.8
 */

import type { AgentSessionMap } from '@/types';
import { seededSessionByAgent } from './messages';

const seedProfiles = (): Record<string, AgentSessionMap> => ({
  // A returning user with bookmarks for greeting_agent + jarvis_agent
  'mock-user-001': {
    greeting_agent: seededSessionByAgent.greeting_agent,
    jarvis_agent: seededSessionByAgent.jarvis_agent,
  },
});

export const mockProfileStore: Record<string, AgentSessionMap> = seedProfiles();

export const resetMockProfileStore = (): void => {
  for (const key of Object.keys(mockProfileStore)) {
    delete mockProfileStore[key];
  }
  Object.assign(mockProfileStore, seedProfiles());
};
