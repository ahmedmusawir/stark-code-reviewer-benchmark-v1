/**
 * @jest-environment jsdom
 */

/**
 * FIX-003 (F06) — the hydration gate in ChatPageContent (gate H3).
 * Intent (Rule K9): with jarvis persisted, greeting_agent content never
 * appears at any point; after the gate opens, jarvis renders and any history
 * fetch targets jarvis only. SessionPanel stays hidden pre-ready.
 */

import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";

jest.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

jest.mock("@/store/useAuthStore", () => ({
  useAuthStore: (
    selector: (state: { user: { id: string; email: string } }) => unknown,
  ) => selector({ user: { id: "test-user-id", email: "test@example.com" } }),
}));

const mockGetHistory = jest.fn();
jest.mock("@/services/chatService", () => ({
  chatService: {
    sendMessage: jest.fn(),
    getHistory: (input: unknown) => mockGetHistory(input),
  },
}));

const mockListSessions = jest.fn();
jest.mock("@/services/sessionIndexService", () => ({
  sessionIndexService: {
    listSessions: (agent: unknown) => mockListSessions(agent),
    createSession: jest.fn().mockResolvedValue(null),
    touchSession: jest.fn(),
    renameSession: jest.fn(),
    archiveSession: jest.fn(),
  },
  titleFromMessage: (m: string) => m,
}));

// Seed the persisted world BEFORE the store module loads (module-level
// hydration): jarvis selected with a live pointer, under the mock-mode key
// (tests run with the flag unset → fail-safe mock namespace).
localStorage.setItem(
  "adk-session-map-mock",
  JSON.stringify({
    state: {
      agentSessions: { jarvis_agent: "session-42" },
      selectedAgent: "jarvis_agent",
    },
    version: 0,
  }),
);

import { ChatPageContent } from "@/app/(cyberize)/chat/ChatPageContent";

describe("ChatPageContent hydration gate (FIX-003)", () => {
  beforeEach(() => {
    mockGetHistory.mockResolvedValue([
      { role: "user", content: "status report" },
      { role: "assistant", content: "All systems nominal." },
    ]);
    mockListSessions.mockResolvedValue([]);
  });

  it("never renders greeting content; jarvis renders after the gate opens (H3)", async () => {
    render(<ChatPageContent />);

    // After the gate opens, jarvis is the rendered agent...
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/ask jarvis_agent/i),
      ).toBeInTheDocument();
    });
    // ...its history arrived...
    await waitFor(() => {
      expect(screen.getByText("All systems nominal.")).toBeInTheDocument();
    });
    // ...and greeting_agent content never appeared.
    expect(
      screen.queryByPlaceholderText(/ask greeting_agent/i),
    ).not.toBeInTheDocument();
  });

  it("every fetch targets the RESTORED agent — no wrong-agent race (H3)", async () => {
    render(<ChatPageContent />);

    await waitFor(() => {
      expect(mockGetHistory).toHaveBeenCalled();
    });
    for (const call of mockGetHistory.mock.calls) {
      expect((call[0] as { agent_name: string }).agent_name).toBe(
        "jarvis_agent",
      );
    }
    for (const call of mockListSessions.mock.calls) {
      expect(call[0]).toBe("jarvis_agent");
    }
  });
});
