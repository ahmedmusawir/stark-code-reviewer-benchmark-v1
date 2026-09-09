"use client";

/**
 * SessionPanel — the Projects panel (BIM-004, D5).
 *
 * Conversations for the SELECTED agent: New Chat on top, list newest-first by
 * updated_at, active session highlighted, inline rename (pencil → input),
 * archive via per-row button. Archived sessions are v1-hidden (no toggle —
 * documented in the acceptance spec). The list is the chat_sessions INDEX;
 * clicking a session loads its transcript through the existing history flow.
 */

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Archive, Check, Pencil, Plus } from "lucide-react";

import { sessionIndexService } from "@/services/sessionIndexService";
import { useChatStore, useHydrationReady } from "@/store/chatStore";
import type { SessionIndexEntry } from "@/types";

export const SessionPanel = () => {
  // FIX-003 (F06): no wrong-agent conversation list before hydration.
  const ready = useHydrationReady();
  const selectedAgent = useChatStore((s) => s.selectedAgent);
  const sessions = useChatStore(
    (s) => s.sessionListByAgent[s.selectedAgent],
  );
  const activeSessionId = useChatStore(
    (s) => s.agentSessions[s.selectedAgent],
  );
  const activateSession = useChatStore((s) => s.activateSession);
  const startNewChat = useChatStore((s) => s.startNewChat);
  const setSessionList = useChatStore((s) => s.setSessionList);
  const upsertSessionEntry = useChatStore((s) => s.upsertSessionEntry);
  const router = useRouter();
  const pathname = usePathname();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // All hooks above this line (rules of hooks); gate the render only.
  if (!ready) return null;

  const goToChat = () => {
    if (!pathname.startsWith("/chat")) router.push("/chat");
  };

  const handleNewChat = () => {
    startNewChat(selectedAgent);
    goToChat();
  };

  const handleSelect = (entry: SessionIndexEntry) => {
    activateSession(selectedAgent, entry.adk_session_id);
    goToChat();
  };

  const beginRename = (entry: SessionIndexEntry) => {
    setEditingId(entry.id);
    setEditingTitle(entry.title);
  };

  const commitRename = (entry: SessionIndexEntry) => {
    const title = editingTitle.trim();
    setEditingId(null);
    if (!title || title === entry.title) return;
    void sessionIndexService.renameSession(entry.id, title);
    upsertSessionEntry(selectedAgent, {
      ...entry,
      title,
      updated_at: new Date().toISOString(),
    });
  };

  const handleArchive = (entry: SessionIndexEntry) => {
    void sessionIndexService.archiveSession(entry.id);
    const remaining = (sessions ?? []).filter((s) => s.id !== entry.id);
    setSessionList(selectedAgent, remaining);
    if (entry.adk_session_id === activeSessionId) {
      startNewChat(selectedAgent);
    }
  };

  return (
    <div className="px-3 py-2 space-y-1 border-t border-zinc-200 dark:border-zinc-600">
      <p className="px-2 py-1 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Conversations
      </p>

      <button
        type="button"
        onClick={handleNewChat}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700/60 transition-colors"
      >
        <Plus size={15} />
        <span>New Chat</span>
      </button>

      {(sessions ?? []).map((entry) => {
        const isActive = entry.adk_session_id === activeSessionId;
        const isEditing = editingId === entry.id;
        return (
          <div
            key={entry.id}
            className={
              "group flex items-center gap-1 rounded-md transition-colors " +
              (isActive
                ? "bg-zinc-200 dark:bg-zinc-700"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-700/60")
            }
          >
            {isEditing ? (
              <input
                autoFocus
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename(entry);
                  if (e.key === "Escape") setEditingId(null);
                }}
                onBlur={() => commitRename(entry)}
                aria-label="Rename conversation"
                className="flex-1 min-w-0 mx-1 my-1 px-2 py-1 rounded text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-500 outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => handleSelect(entry)}
                title={entry.title}
                className={
                  "flex-1 min-w-0 text-left px-3 py-2 text-sm truncate " +
                  (isActive
                    ? "text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-700 dark:text-zinc-300")
                }
              >
                {entry.title}
              </button>
            )}

            {isEditing ? (
              <button
                type="button"
                onClick={() => commitRename(entry)}
                aria-label="Save name"
                className="shrink-0 h-8 w-8 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <Check size={13} />
              </button>
            ) : (
              <div className="shrink-0 flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => beginRename(entry)}
                  aria-label={`Rename ${entry.title}`}
                  className="h-8 w-8 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleArchive(entry)}
                  aria-label={`Archive ${entry.title}`}
                  className="h-8 w-8 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <Archive size={13} />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
