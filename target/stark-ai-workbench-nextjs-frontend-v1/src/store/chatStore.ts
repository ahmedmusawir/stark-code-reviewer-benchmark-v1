/**
 * chatStore — Zustand state for the cyberize chat experience.
 *
 * Phase 5.5 refactor: messages are now per-agent (`messagesByAgent`) for
 * cross-agent retention. Switching to a previously-visited agent shows that
 * agent's preserved thread.
 *
 * Message content (`messagesByAgent`) is in-memory only; reloads wipe it and it
 * reloads from the server. FIX-001 persists ONLY the agent→session pointer
 * (`agentSessions`) to localStorage via persist+partialize, so an existing
 * chat's history survives a refresh — the bookmark persists, transcripts do not.
 *
 * @see _project/DATA_CONTRACT.md §1 for the underlying types
 * @see agent_docs/CURRENT_APP/FIX001/CLAUDE.md
 */

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { DEFAULT_AGENT as MANIFEST_DEFAULT_AGENT } from "@/config/manifest";
import type {
  AgentName,
  AgentSessionMap,
  Message,
  SessionIndexEntry,
} from "@/types";

// BIM-003: the default agent is the manifest's first entry (order is
// meaningful). FIX-002's persisted selection still wins over this on reload.
const DEFAULT_AGENT: AgentName = MANIFEST_DEFAULT_AGENT;

// FIX-003 (F09): each mode gets its OWN persisted namespace — mock pointers
// must never poison live sessions, and switching modes must never destroy the
// other world's state. Same fail-safe default as the services: anything but
// 'live' is mock.
const PERSIST_MODE =
  process.env.NEXT_PUBLIC_CHAT_MODE === "live" ? "live" : "mock";
const PERSIST_KEY = `adk-session-map-${PERSIST_MODE}`;
const LEGACY_PERSIST_KEY = "adk-session-map";

// Migration kindness: a pre-FIX-003 browser carries the legacy shared key.
// On LIVE boot only, adopt it once into the live namespace (mock never
// adopts — mock pointers were the poison). The legacy key is left in place,
// dead. One-time, silent beyond a console.info.
if (typeof window !== "undefined" && PERSIST_MODE === "live") {
  try {
    const legacy = window.localStorage.getItem(LEGACY_PERSIST_KEY);
    if (legacy !== null && window.localStorage.getItem(PERSIST_KEY) === null) {
      window.localStorage.setItem(PERSIST_KEY, legacy);
      // eslint-disable-next-line no-console
      console.info(
        "[chatStore] FIX-003: adopted legacy adk-session-map into adk-session-map-live",
      );
    }
  } catch {
    // storage unavailable — nothing to adopt
  }
}

interface ChatState {
  selectedAgent: AgentName;
  lastSelectedAgent: AgentName | null;
  /** The ACTIVE session's messages per agent (BIM-004). Undefined = not yet loaded. Empty array = loaded, no messages. */
  messagesByAgent: Record<string, Message[]>;
  /**
   * BIM-004 (D6): demoted to "last ACTIVE ADK session per agent" — the
   * persisted pointer cache. The chat_sessions index (DB) is authority.
   */
  agentSessions: AgentSessionMap;
  /** In-memory session index cache per agent (never persisted). */
  sessionListByAgent: Record<string, SessionIndexEntry[]>;
  isLoading: boolean;
  /** True while a history fetch is in flight (FIX-002b) — never persisted. */
  isHistoryLoading: boolean;
  /**
   * True once persist has rehydrated (FIX-003 F06) — never persisted, NOT in
   * INITIAL_STATE (reset() must not re-suppress the UI). Consume via
   * useHydrationReady(), not directly (SSR-mismatch safety).
   */
  _hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  error: string | null;

  setSelectedAgent: (name: AgentName) => void;
  /** Replace messages for a specific agent (typically after a history fetch) */
  setMessagesForAgent: (agent: AgentName, messages: Message[]) => void;
  /** Append a single message to a specific agent's thread */
  appendMessageForAgent: (agent: AgentName, message: Message) => void;
  /** Truncate an agent's messages, keeping only items at index `0..keepThroughIndex` (inclusive). Use -1 to clear. */
  truncateAfterIndex: (agent: AgentName, keepThroughIndex: number) => void;
  setAgentSessions: (sessions: AgentSessionMap) => void;
  setSession: (agent: AgentName, sessionId: string) => void;
  /** Replace an agent's cached session list (after an index fetch). */
  setSessionList: (agent: AgentName, sessions: SessionIndexEntry[]) => void;
  /** Insert-or-update one index entry (newest-first order maintained). */
  upsertSessionEntry: (agent: AgentName, entry: SessionIndexEntry) => void;
  /** Switch the active session: set the pointer, clear messages → refetch. */
  activateSession: (agent: AgentName, adkSessionId: string) => void;
  /** New Chat: clear the pointer, show the loaded-empty thread (D2: no row until first reply). */
  startNewChat: (agent: AgentName) => void;
  setLoading: (loading: boolean) => void;
  setHistoryLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  selectedAgent: DEFAULT_AGENT,
  lastSelectedAgent: null,
  messagesByAgent: {} as Record<string, Message[]>,
  agentSessions: {} as AgentSessionMap,
  sessionListByAgent: {} as Record<string, SessionIndexEntry[]>,
  isLoading: false,
  isHistoryLoading: false,
  error: null,
};

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      _hasHydrated: false,
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      setSelectedAgent: (name) =>
        set((state) => ({
          selectedAgent: name,
          lastSelectedAgent: state.selectedAgent,
        })),
      setMessagesForAgent: (agent, messages) =>
        set((state) => ({
          messagesByAgent: { ...state.messagesByAgent, [agent]: messages },
        })),
      appendMessageForAgent: (agent, message) =>
        set((state) => ({
          messagesByAgent: {
            ...state.messagesByAgent,
            [agent]: [...(state.messagesByAgent[agent] ?? []), message],
          },
        })),
      truncateAfterIndex: (agent, keepThroughIndex) =>
        set((state) => {
          const current = state.messagesByAgent[agent] ?? [];
          const next =
            keepThroughIndex < 0 ? [] : current.slice(0, keepThroughIndex + 1);
          return {
            messagesByAgent: { ...state.messagesByAgent, [agent]: next },
          };
        }),
      setAgentSessions: (sessions) => set({ agentSessions: sessions }),
      setSession: (agent, sessionId) =>
        set((state) => ({
          agentSessions: { ...state.agentSessions, [agent]: sessionId },
        })),
      setSessionList: (agent, sessions) =>
        set((state) => ({
          sessionListByAgent: {
            ...state.sessionListByAgent,
            [agent]: sessions,
          },
        })),
      upsertSessionEntry: (agent, entry) =>
        set((state) => {
          const current = state.sessionListByAgent[agent] ?? [];
          const rest = current.filter((s) => s.id !== entry.id);
          return {
            sessionListByAgent: {
              ...state.sessionListByAgent,
              [agent]: [entry, ...rest],
            },
          };
        }),
      activateSession: (agent, adkSessionId) =>
        set((state) => {
          if (state.agentSessions[agent] === adkSessionId) return state;
          const messages = { ...state.messagesByAgent };
          delete messages[agent]; // undefined = not loaded → history refetch
          return {
            agentSessions: { ...state.agentSessions, [agent]: adkSessionId },
            messagesByAgent: messages,
          };
        }),
      startNewChat: (agent) =>
        set((state) => {
          const sessions = { ...state.agentSessions };
          delete sessions[agent]; // no pointer: next reply births the session
          return {
            agentSessions: sessions,
            messagesByAgent: { ...state.messagesByAgent, [agent]: [] },
          };
        }),
      setLoading: (loading) => set({ isLoading: loading }),
      setHistoryLoading: (loading) => set({ isHistoryLoading: loading }),
      setError: (error) => set({ error }),
      reset: () => set(INITIAL_STATE),
    }),
    {
      name: PERSIST_KEY, // FIX-003 (F09): mode-namespaced
      // SSR guard: on the server `window` throws, createJSONStorage catches
      // it and returns undefined storage → store degrades to in-memory
      // exactly as before FIX-001.
      storage: createJSONStorage(() => window.localStorage),
      // FIX-003 (F06): flip the hydration flag when restore completes. On the
      // server hydration never runs, so the flag stays false there.
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      // F4 fence: ONLY the agent→session bookmark and the selected agent are
      // persisted (FIX-002a). Message content (messagesByAgent) must never
      // reach localStorage.
      partialize: (state) => ({
        agentSessions: state.agentSessions,
        selectedAgent: state.selectedAgent,
      }),
    },
  ),
);

/**
 * FIX-003 (F06): the mismatch-safe hydration gate. `_hasHydrated` flips
 * synchronously when persist restores — but the SERVER never hydrates, so
 * gating on the flag alone would make the first client paint differ from the
 * server HTML (that mismatch IS part of the wrong-agent flash). The two-pass
 * `mounted` check keeps first paint identical to the server (loading idiom),
 * then reveals the restored agent one frame later. Greeting never flashes.
 */
export function useHydrationReady(): boolean {
  const hasHydrated = useChatStore((s) => s._hasHydrated);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && hasHydrated;
}
