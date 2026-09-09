/**
 * @jest-environment jsdom
 */

/**
 * BIM-004 — chatStore session reshape (D6) + the P-G5 persistence fence.
 * Intent (Rule K9): activateSession/startNewChat drive the pointer+thread
 * correctly, the session list cache upserts newest-first, and the PERSISTED
 * shape remains pointers-only — session lists and messages never reach
 * localStorage.
 */

import { useChatStore } from "@/store/chatStore";
import type { SessionIndexEntry } from "@/types";

const entry = (
  id: string,
  adkSessionId: string,
  updatedAt: string,
): SessionIndexEntry => ({
  id,
  agent_name: "jarvis_agent",
  adk_session_id: adkSessionId,
  title: `Chat ${id}`,
  created_at: updatedAt,
  updated_at: updatedAt,
  archived: false,
});

describe("chatStore session reshape (BIM-004)", () => {
  beforeEach(() => {
    localStorage.clear();
    useChatStore.getState().reset();
  });

  it("activateSession sets the pointer and clears the thread (→ refetch)", () => {
    const s = useChatStore.getState();
    s.setMessagesForAgent("jarvis_agent", [{ role: "user", content: "hi" }]);
    s.setSession("jarvis_agent", "session-1");

    useChatStore.getState().activateSession("jarvis_agent", "session-2");

    const after = useChatStore.getState();
    expect(after.agentSessions.jarvis_agent).toBe("session-2");
    expect(after.messagesByAgent.jarvis_agent).toBeUndefined();
  });

  it("activateSession on the already-active session is a no-op (thread kept)", () => {
    const s = useChatStore.getState();
    s.setSession("jarvis_agent", "session-1");
    s.setMessagesForAgent("jarvis_agent", [{ role: "user", content: "hi" }]);

    useChatStore.getState().activateSession("jarvis_agent", "session-1");

    expect(
      useChatStore.getState().messagesByAgent.jarvis_agent,
    ).toHaveLength(1);
  });

  it("startNewChat clears the pointer and shows a loaded-empty thread (D2)", () => {
    const s = useChatStore.getState();
    s.setSession("jarvis_agent", "session-1");
    s.setMessagesForAgent("jarvis_agent", [{ role: "user", content: "hi" }]);

    useChatStore.getState().startNewChat("jarvis_agent");

    const after = useChatStore.getState();
    expect(after.agentSessions.jarvis_agent).toBeUndefined();
    expect(after.messagesByAgent.jarvis_agent).toEqual([]);
  });

  it("setSessionList replaces; upsertSessionEntry inserts newest-first and dedupes", () => {
    const a = entry("row-a", "session-a", "2026-07-01T10:00:00Z");
    const b = entry("row-b", "session-b", "2026-07-02T10:00:00Z");
    useChatStore.getState().setSessionList("jarvis_agent", [b, a]);

    const updatedA = { ...a, title: "Renamed", updated_at: "2026-07-03T10:00:00Z" };
    useChatStore.getState().upsertSessionEntry("jarvis_agent", updatedA);

    const list = useChatStore.getState().sessionListByAgent.jarvis_agent;
    expect(list.map((s) => s.id)).toEqual(["row-a", "row-b"]);
    expect(list[0].title).toBe("Renamed");
  });

  it("P-G5 fence: persisted shape is STILL pointers-only — no lists, no messages", () => {
    const s = useChatStore.getState();
    s.setSession("jarvis_agent", "session-1");
    s.setSessionList("jarvis_agent", [
      entry("row-a", "session-a", "2026-07-01T10:00:00Z"),
    ]);
    s.appendMessageForAgent("jarvis_agent", {
      role: "user",
      content: "SECRET-CONTENT",
    });

    const raw = localStorage.getItem("adk-session-map-mock") as string;
    const stored = JSON.parse(raw);
    expect(Object.keys(stored.state).sort()).toEqual([
      "agentSessions",
      "selectedAgent",
    ]);
    expect(raw).not.toContain("SECRET-CONTENT");
    expect(raw).not.toContain("row-a");
  });
});
