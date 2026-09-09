/**
 * @jest-environment jsdom
 */

/**
 * Integration test for the send-message flow (Phase 5).
 * Intent (Rule K9): verify the end-to-end orchestration —
 *   typing + Enter → user bubble → loading dots → assistant bubble.
 * If this passes, the chatStore + services + UI components are wired correctly.
 */

import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

jest.mock("@/store/useAuthStore", () => ({
  useAuthStore: (
    selector: (state: { user: { id: string; email: string } }) => unknown,
  ) =>
    selector({ user: { id: "test-user-id", email: "test@example.com" } }),
}));

const mockSendMessage = jest.fn();
const mockGetHistory = jest.fn();
const mockFetchProfile = jest.fn();
const mockSaveProfile = jest.fn();

jest.mock("@/services/chatService", () => ({
  chatService: {
    sendMessage: (
      input: Parameters<typeof mockSendMessage>[0],
    ) => mockSendMessage(input),
    getHistory: (
      input: Parameters<typeof mockGetHistory>[0],
    ) => mockGetHistory(input),
  },
}));

jest.mock("@/services/profileService", () => ({
  profileService: {
    fetchProfile: (
      userId: Parameters<typeof mockFetchProfile>[0],
    ) => mockFetchProfile(userId),
    saveProfile: (
      userId: Parameters<typeof mockSaveProfile>[0],
      sessions: Parameters<typeof mockSaveProfile>[1],
    ) => mockSaveProfile(userId, sessions),
  },
}));

import { ChatPageContent } from "@/app/(cyberize)/chat/ChatPageContent";
import { useChatStore } from "@/store/chatStore";

describe("ChatPageContent integration", () => {
  beforeEach(() => {
    mockSendMessage.mockReset();
    mockGetHistory.mockReset();
    mockFetchProfile.mockReset();
    mockSaveProfile.mockReset();
    mockFetchProfile.mockResolvedValue({});
    mockSaveProfile.mockResolvedValue(undefined);
    useChatStore.getState().reset();
  });

  it("send flow: user message appears → assistant response appears", async () => {
    mockSendMessage.mockResolvedValueOnce({
      response: "Hi there",
      session_id: "mock-session-123",
    });
    const user = userEvent.setup();
    render(<ChatPageContent />);

    const input = await screen.findByPlaceholderText(/ask greeting_agent/i);
    await user.type(input, "hello{Enter}");

    // User message bubble appears immediately
    await waitFor(() => {
      expect(screen.getByText("hello")).toBeInTheDocument();
    });

    // Assistant response appears after sendMessage resolves
    await waitFor(() => {
      expect(screen.getByText("Hi there")).toBeInTheDocument();
    });

    expect(mockSendMessage).toHaveBeenCalledWith({
      agent_name: "greeting_agent",
      message: "hello",
      user_id: "test-user-id",
      session_id: null,
    });
  });
});
