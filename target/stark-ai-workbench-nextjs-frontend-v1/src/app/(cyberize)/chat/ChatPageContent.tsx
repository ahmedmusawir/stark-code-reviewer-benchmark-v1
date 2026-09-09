"use client";

import { useEffect, useRef, useState } from "react";

import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore, useHydrationReady } from "@/store/chatStore";
import { chatService } from "@/services/chatService";
import {
  sessionIndexService,
  titleFromMessage,
} from "@/services/sessionIndexService";
import type { AgentName } from "@/types";

import { ChatInput } from "./ChatInput";
import { MessageList } from "./MessageList";

export const ChatPageContent = () => {
  const user = useAuthStore((s) => s.user);
  const selectedAgent = useChatStore((s) => s.selectedAgent);
  const setMessagesForAgent = useChatStore((s) => s.setMessagesForAgent);
  const appendMessageForAgent = useChatStore((s) => s.appendMessageForAgent);
  const truncateAfterIndex = useChatStore((s) => s.truncateAfterIndex);
  const setSession = useChatStore((s) => s.setSession);
  const setSessionList = useChatStore((s) => s.setSessionList);
  const upsertSessionEntry = useChatStore((s) => s.upsertSessionEntry);
  const activeSessionId = useChatStore(
    (s) => s.agentSessions[s.selectedAgent],
  );
  const setLoading = useChatStore((s) => s.setLoading);
  const setHistoryLoading = useChatStore((s) => s.setHistoryLoading);
  const setError = useChatStore((s) => s.setError);
  // FIX-003 (F06): nothing agent-specific renders or fetches until the
  // persisted selection has hydrated — no wrong-agent flash, no wrong fetch.
  const ready = useHydrationReady();

  const userId =
    user && typeof user === "object" && "id" in user
      ? String((user as { id: unknown }).id ?? "")
      : "";

  // Tracks initial profile-fetch completion to prevent the agent-switch effect
  // from racing the mount effect on first render.
  const hasMountedRef = useRef(false);

  // Edit-message state. When non-null, the chat input is prefilled with
  // editingValue and submitting will truncate + replace from that point.
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  // BIM-004 (D4): fetch the agent's session index; a persisted pointer with
  // no matching row is adopted as a "Restored chat" entry — nothing orphaned.
  const loadSessionListFor = async (agent: AgentName) => {
    let list = await sessionIndexService.listSessions(agent);
    const pointer = useChatStore.getState().agentSessions[agent];
    if (pointer && !list.some((s) => s.adk_session_id === pointer)) {
      const adopted = await sessionIndexService.createSession(
        agent,
        pointer,
        "Restored chat",
      );
      if (adopted) list = [adopted, ...list];
    }
    setSessionList(agent, list);
  };

  // Mount effect (BIM-004): load the session INDEX for the default agent
  // (with D4 adoption), then the active session's history. profileService is
  // out of the chat path (D1) — the chat_sessions index is authority; the
  // persisted map is only the "last active session per agent" pointer cache.
  useEffect(() => {
    if (!ready || !userId) return; // FIX-003: wait for the persisted selection
    void (async () => {
      await loadSessionListFor(selectedAgent);
      const sessionId = useChatStore.getState().agentSessions[selectedAgent];
      if (sessionId) {
        // FIX-002b: signal the history fetch; getHistory resolves-not-throws,
        // but finally keeps the flag honest regardless.
        setHistoryLoading(true);
        try {
          const history = await chatService.getHistory({
            agent_name: selectedAgent,
            user_id: userId,
            session_id: sessionId,
          });
          setMessagesForAgent(selectedAgent, history);
        } finally {
          setHistoryLoading(false);
        }
      } else {
        setMessagesForAgent(selectedAgent, []);
      }
      hasMountedRef.current = true;
    })();
    // selectedAgent intentionally not in deps — mount-only (post-hydration).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, userId, setMessagesForAgent]);

  // Agent-switch / session-switch effect (BIM-004): lazy-load the session
  // index on an agent's first visit; (re)fetch history whenever the active
  // thread is not loaded — activateSession clears it to retrigger this.
  useEffect(() => {
    if (!ready || !hasMountedRef.current) return; // FIX-003 gate
    const state = useChatStore.getState();
    if (state.sessionListByAgent[selectedAgent] === undefined) {
      void loadSessionListFor(selectedAgent);
    }
    const existing = state.messagesByAgent[selectedAgent];
    if (existing !== undefined) {
      // already loaded — display in place
      return;
    }
    const sessionId = state.agentSessions[selectedAgent];
    if (!sessionId) {
      setMessagesForAgent(selectedAgent, []);
      return;
    }
    setHistoryLoading(true); // FIX-002b
    void chatService
      .getHistory({
        agent_name: selectedAgent,
        user_id: userId,
        session_id: sessionId,
      })
      .then((history) => setMessagesForAgent(selectedAgent, history))
      .finally(() => setHistoryLoading(false));
    // loadSessionListFor is stable-per-render plumbing, not a reactive input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ready,
    selectedAgent,
    activeSessionId,
    userId,
    setMessagesForAgent,
    setHistoryLoading,
  ]);

  const runSendMessage = async (content: string) => {
    if (!userId) return;
    setError(null);
    appendMessageForAgent(selectedAgent, { role: "user", content });
    setLoading(true);

    const existing =
      useChatStore.getState().agentSessions[selectedAgent] ?? null;
    const response = await chatService
      .sendMessage({
        agent_name: selectedAgent,
        message: content,
        user_id: userId,
        session_id: existing,
      })
      .catch((err: Error) => {
        setError(err.message || "Failed to reach the agent. Please try again.");
        setLoading(false);
        return null;
      });

    if (!response) return;

    appendMessageForAgent(selectedAgent, {
      role: "assistant",
      content: response.response,
    });
    setLoading(false);

    // BIM-004 (D2): the first successful reply births the index row,
    // auto-titled from the first user message (D3); later replies bump
    // updated_at. Index failures never block chat (service degrades).
    if (!existing && response.session_id) {
      setSession(selectedAgent, response.session_id);
      void sessionIndexService
        .createSession(
          selectedAgent,
          response.session_id,
          titleFromMessage(content),
        )
        .then((entry) => {
          if (entry) upsertSessionEntry(selectedAgent, entry);
        });
    } else if (existing) {
      const entry = useChatStore
        .getState()
        .sessionListByAgent[selectedAgent]?.find(
          (s) => s.adk_session_id === existing,
        );
      if (entry) {
        void sessionIndexService.touchSession(entry.id);
        upsertSessionEntry(selectedAgent, {
          ...entry,
          updated_at: new Date().toISOString(),
        });
      }
    }
  };

  const handleSubmit = async (content: string) => {
    if (editingIndex !== null) {
      // Edit flow: truncate to drop original user message + everything after,
      // then append the edited user message via the normal send flow.
      truncateAfterIndex(selectedAgent, editingIndex - 1);
      setEditingIndex(null);
      setEditingValue("");
    }
    await runSendMessage(content);
  };

  const handleEditUserMessage = (index: number) => {
    const messages =
      useChatStore.getState().messagesByAgent[selectedAgent] ?? [];
    const target = messages[index];
    if (!target || target.role !== "user") return;
    setEditingIndex(index);
    setEditingValue(target.content);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue("");
  };

  const doRegenerate = async () => {
    if (!userId) return;
    const messages =
      useChatStore.getState().messagesByAgent[selectedAgent] ?? [];
    if (messages.length < 2) return;
    let lastUserIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserIdx = i;
        break;
      }
    }
    if (lastUserIdx === -1) return;
    const lastUser = messages[lastUserIdx];

    // Truncate to keep up through the user message
    truncateAfterIndex(selectedAgent, lastUserIdx);
    setError(null);
    setLoading(true);

    const existing =
      useChatStore.getState().agentSessions[selectedAgent] ?? null;
    const response = await chatService
      .sendMessage({
        agent_name: selectedAgent,
        message: lastUser.content,
        user_id: userId,
        session_id: existing,
      })
      .catch((err: Error) => {
        setError(
          err.message || "Failed to regenerate. Please try again.",
        );
        setLoading(false);
        return null;
      });

    if (!response) return;

    appendMessageForAgent(selectedAgent, {
      role: "assistant",
      content: response.response,
    });
    setLoading(false);
  };

  const handleFeedback = (direction: "up" | "down", index: number) => {
    // eslint-disable-next-line no-console
    console.info(
      `[ChatPageContent] feedback ${direction} for agent=${selectedAgent} msgIndex=${index}`,
    );
    // Future: POST to feedback endpoint.
  };

  // FIX-003 (F06): until the persisted selection hydrates, show the FIX-002
  // loading idiom instead of any agent-specific content. Server HTML and the
  // first client paint both render this branch — no flash, no SSR mismatch.
  if (!ready) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center px-4">
          <div
            className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 animate-pulse"
            role="status"
            aria-label="Loading conversation"
          >
            <span>Loading conversation…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <MessageList
        onEditUserMessage={handleEditUserMessage}
        onRegenerate={doRegenerate}
        onFeedback={handleFeedback}
      />
      <ChatInput
        key={editingIndex ?? "fresh"}
        onSubmit={handleSubmit}
        initialValue={editingIndex !== null ? editingValue : undefined}
        isEditing={editingIndex !== null}
        onCancelEdit={handleCancelEdit}
      />
    </div>
  );
};
