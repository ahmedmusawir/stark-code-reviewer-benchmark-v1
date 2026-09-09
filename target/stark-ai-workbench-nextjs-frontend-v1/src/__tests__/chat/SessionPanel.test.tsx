/**
 * @jest-environment jsdom
 */

/**
 * BIM-004 — SessionPanel interactions (D5).
 * Intent (Rule K9): the panel lists the selected agent's sessions, New Chat
 * starts a fresh thread, clicking a session activates it, inline rename
 * commits, and archive removes the row from the visible list.
 */

import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/chat",
}));

const renameMock = jest.fn().mockResolvedValue(undefined);
const archiveMock = jest.fn().mockResolvedValue(undefined);
jest.mock("@/services/sessionIndexService", () => ({
  sessionIndexService: {
    renameSession: (...args: unknown[]) => renameMock(...args),
    archiveSession: (...args: unknown[]) => archiveMock(...args),
  },
}));

import { SessionPanel } from "@/components/chat/SessionPanel";
import { useChatStore } from "@/store/chatStore";
import type { SessionIndexEntry } from "@/types";

const AGENT = "greeting_agent"; // manifest default — selectedAgent after reset

const entry = (id: string, adkSessionId: string, title: string): SessionIndexEntry => ({
  id,
  agent_name: AGENT,
  adk_session_id: adkSessionId,
  title,
  created_at: "2026-07-01T10:00:00Z",
  updated_at: "2026-07-01T10:00:00Z",
  archived: false,
});

describe("SessionPanel (BIM-004)", () => {
  beforeEach(() => {
    renameMock.mockClear();
    archiveMock.mockClear();
    localStorage.clear();
    useChatStore.getState().reset();
    useChatStore.getState().setSessionList(AGENT, [
      entry("row-1", "session-1", "First conversation"),
      entry("row-2", "session-2", "Second conversation"),
    ]);
  });

  it("lists the selected agent's sessions with a New Chat button on top", () => {
    render(<SessionPanel />);
    expect(screen.getByRole("button", { name: /new chat/i })).toBeInTheDocument();
    expect(screen.getByText("First conversation")).toBeInTheDocument();
    expect(screen.getByText("Second conversation")).toBeInTheDocument();
  });

  it("clicking a session activates it (pointer set, thread cleared)", async () => {
    const user = userEvent.setup();
    render(<SessionPanel />);

    await user.click(screen.getByText("Second conversation"));

    expect(useChatStore.getState().agentSessions[AGENT]).toBe("session-2");
    expect(useChatStore.getState().messagesByAgent[AGENT]).toBeUndefined();
  });

  it("New Chat clears the pointer and shows a loaded-empty thread", async () => {
    const user = userEvent.setup();
    useChatStore.getState().setSession(AGENT, "session-1");
    render(<SessionPanel />);

    await user.click(screen.getByRole("button", { name: /new chat/i }));

    expect(useChatStore.getState().agentSessions[AGENT]).toBeUndefined();
    expect(useChatStore.getState().messagesByAgent[AGENT]).toEqual([]);
  });

  it("inline rename commits to the service and the store list", async () => {
    const user = userEvent.setup();
    render(<SessionPanel />);

    await user.click(
      screen.getByRole("button", { name: /rename first conversation/i }),
    );
    const input = screen.getByRole("textbox", { name: /rename conversation/i });
    await user.clear(input);
    await user.type(input, "Renamed thread{Enter}");

    expect(renameMock).toHaveBeenCalledWith("row-1", "Renamed thread");
    await waitFor(() => {
      expect(screen.getByText("Renamed thread")).toBeInTheDocument();
    });
    const list = useChatStore.getState().sessionListByAgent[AGENT];
    expect(list.find((s) => s.id === "row-1")!.title).toBe("Renamed thread");
  });

  it("archive removes the row from the visible list (P-G3)", async () => {
    const user = userEvent.setup();
    render(<SessionPanel />);

    await user.click(
      screen.getByRole("button", { name: /archive second conversation/i }),
    );

    expect(archiveMock).toHaveBeenCalledWith("row-2");
    expect(screen.queryByText("Second conversation")).not.toBeInTheDocument();
    const list = useChatStore.getState().sessionListByAgent[AGENT];
    expect(list.map((s) => s.id)).toEqual(["row-1"]);
  });

  it("archiving the ACTIVE session starts a new chat", async () => {
    const user = userEvent.setup();
    useChatStore.getState().setSession(AGENT, "session-2");
    render(<SessionPanel />);

    await user.click(
      screen.getByRole("button", { name: /archive second conversation/i }),
    );

    expect(useChatStore.getState().agentSessions[AGENT]).toBeUndefined();
    expect(useChatStore.getState().messagesByAgent[AGENT]).toEqual([]);
  });
});
