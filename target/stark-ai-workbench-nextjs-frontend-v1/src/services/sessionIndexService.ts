/**
 * sessionIndexService — the chat_sessions INDEX, mode-flagged (BIM-004, D1).
 *
 * `NEXT_PUBLIC_CHAT_MODE=live` → Supabase `chat_sessions` table (RLS scopes
 * rows to the signed-in user). Any other value → in-memory mock index (D8).
 *
 * DOCTRINE: the index is not the transcript. Rows carry which sessions exist
 * — never message content. Index failures degrade non-blocking (console.error
 * + safe fallback): chat must never break because the index hiccuped.
 *
 * @see agent_docs/CURRENT_APP/BIM004/CLAUDE.md (Amendment A4)
 */

import {
  mockSessionIndex,
  newMockRowId,
} from '@/mocks/data/sessionIndex';
import type { SessionIndexEntry } from '@/types';
import { createClient } from '@/utils/supabase/client';

const TITLE_MAX_CHARS = 50;

const isLive = () => process.env.NEXT_PUBLIC_CHAT_MODE === 'live';

/** D3: auto-title = first user message, truncated ~50 chars with ellipsis. */
export function titleFromMessage(message: string): string {
  const collapsed = message.replace(/\s+/g, ' ').trim();
  if (collapsed.length === 0) return 'New chat';
  if (collapsed.length <= TITLE_MAX_CHARS) return collapsed;
  return `${collapsed.slice(0, TITLE_MAX_CHARS).trimEnd()}…`;
}

const nowIso = () => new Date().toISOString();

async function liveUserId(): Promise<string | null> {
  const { data, error } = await createClient().auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

export const sessionIndexService = {
  /**
   * Non-archived sessions for an agent, newest-first by updated_at.
   * Failure → [] (the panel shows empty; chat itself is unaffected).
   */
  listSessions: async (agentName: string): Promise<SessionIndexEntry[]> => {
    if (isLive()) {
      try {
        const { data, error } = await createClient()
          .from('chat_sessions')
          .select(
            'id, agent_name, adk_session_id, title, created_at, updated_at, archived',
          )
          .eq('agent_name', agentName)
          .eq('archived', false)
          .order('updated_at', { ascending: false });
        if (error) throw error;
        return (data ?? []) as SessionIndexEntry[];
      } catch (e) {
        console.error('sessionIndexService.listSessions failed:', e);
        return [];
      }
    }

    return mockSessionIndex
      .filter((row) => row.agent_name === agentName && !row.archived)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  },

  /**
   * D2: called when a session's FIRST successful reply returns. Failure →
   * null (the chat continues; the row can be adopted on a later load).
   */
  createSession: async (
    agentName: string,
    adkSessionId: string,
    title: string,
  ): Promise<SessionIndexEntry | null> => {
    if (isLive()) {
      try {
        const userId = await liveUserId();
        if (!userId) throw new Error('no authenticated user');
        const { data, error } = await createClient()
          .from('chat_sessions')
          .insert({
            user_id: userId,
            agent_name: agentName,
            adk_session_id: adkSessionId,
            title,
          })
          .select(
            'id, agent_name, adk_session_id, title, created_at, updated_at, archived',
          )
          .single();
        if (error) throw error;
        return data as SessionIndexEntry;
      } catch (e) {
        console.error('sessionIndexService.createSession failed:', e);
        return null;
      }
    }

    const entry: SessionIndexEntry = {
      id: newMockRowId(),
      agent_name: agentName,
      adk_session_id: adkSessionId,
      title,
      created_at: nowIso(),
      updated_at: nowIso(),
      archived: false,
    };
    mockSessionIndex.push(entry);
    return entry;
  },

  /** D2: bump updated_at after a successful exchange. Fire-and-forget. */
  touchSession: async (id: string): Promise<void> => {
    if (isLive()) {
      try {
        const { error } = await createClient()
          .from('chat_sessions')
          .update({ updated_at: nowIso() })
          .eq('id', id);
        if (error) throw error;
      } catch (e) {
        console.error('sessionIndexService.touchSession failed:', e);
      }
      return;
    }

    const row = mockSessionIndex.find((r) => r.id === id);
    if (row) row.updated_at = nowIso();
  },

  renameSession: async (id: string, title: string): Promise<void> => {
    if (isLive()) {
      try {
        const { error } = await createClient()
          .from('chat_sessions')
          .update({ title, updated_at: nowIso() })
          .eq('id', id);
        if (error) throw error;
      } catch (e) {
        console.error('sessionIndexService.renameSession failed:', e);
      }
      return;
    }

    const row = mockSessionIndex.find((r) => r.id === id);
    if (row) {
      row.title = title;
      row.updated_at = nowIso();
    }
  },

  /** v1: archive, never delete (no DELETE policy on the table). */
  archiveSession: async (id: string): Promise<void> => {
    if (isLive()) {
      try {
        const { error } = await createClient()
          .from('chat_sessions')
          .update({ archived: true, updated_at: nowIso() })
          .eq('id', id);
        if (error) throw error;
      } catch (e) {
        console.error('sessionIndexService.archiveSession failed:', e);
      }
      return;
    }

    const row = mockSessionIndex.find((r) => r.id === id);
    if (row) row.archived = true;
  },
};
