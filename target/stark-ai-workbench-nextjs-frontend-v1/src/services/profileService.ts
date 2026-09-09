/**
 * profileService — Phase 3 (mock-wired).
 *
 * Mock data swap point. Phase 2 of overall lifecycle replaces these mock
 * imports + bodies with real Supabase row reads/writes. Method signatures stay identical.
 *
 * @see _project/DATA_CONTRACT.md §2.3
 */

import { mockProfileStore } from '@/mocks/data/profiles';
import type { AgentSessionMap } from '@/types';

const MOCK_DELAY_MS = 200;

export const profileService = {
  /**
   * Fetch the per-user agent_sessions map.
   * Mock: returns seeded map for known userIds; {} otherwise.
   */
  fetchProfile: async (userId: string): Promise<AgentSessionMap> => {
    await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
    return mockProfileStore[userId] ?? {};
  },

  /**
   * Persist the per-user agent_sessions map.
   * Mock: mutates the in-memory store. Reloads wipe state.
   */
  saveProfile: async (
    userId: string,
    sessions: AgentSessionMap,
  ): Promise<void> => {
    await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
    mockProfileStore[userId] = sessions;
  },
};

/**
 * BACKEND_SWAP_NOTES
 *
 * Method        | Supabase operation                                                         | Notes
 * --------------|----------------------------------------------------------------------------|-------------------------------------------
 * fetchProfile  | supabase.from('adk_n8n_hybrid_profiles').select('agent_sessions').eq('id', userId) | New users: returns `{}`
 * saveProfile   | supabase.from('adk_n8n_hybrid_profiles').upsert({ id: userId, agent_sessions: sessions }) | Full-dict overwrite, not patch/merge
 *
 * RLS policies on `adk_n8n_hybrid_profiles` assumed to enforce per-user row isolation.
 * Auth context: requires authenticated Supabase session (kit's existing flow).
 */
