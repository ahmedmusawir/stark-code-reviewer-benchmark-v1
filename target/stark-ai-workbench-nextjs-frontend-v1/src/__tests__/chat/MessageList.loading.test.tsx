/**
 * @jest-environment jsdom
 */

/**
 * FIX-002b — history-fetch loading state (gate X2).
 * Intent (Rule K9): while a history fetch is in flight the transcript area
 * shows "Loading conversation…" instead of the misleading "start the
 * conversation" empty-state; both prior branches are untouched otherwise.
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

import { MessageList } from "@/app/(cyberize)/chat/MessageList";
import { useChatStore } from "@/store/chatStore";

describe("MessageList history loading state (FIX-002b)", () => {
  beforeEach(() => {
    localStorage.clear();
    useChatStore.getState().reset();
  });

  it("shows the loading indicator and suppresses the empty-state while history loads", () => {
    useChatStore.getState().setHistoryLoading(true);

    render(<MessageList />);

    expect(screen.getByText(/Loading conversation…/)).toBeInTheDocument();
    expect(
      screen.queryByText(/Send a message to start the conversation/),
    ).not.toBeInTheDocument();
  });

  it("renders the empty-state exactly as before when nothing is loading", () => {
    render(<MessageList />);

    expect(
      screen.getByText(/Send a message to start the conversation/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Loading conversation…/)).not.toBeInTheDocument();
  });

  it("renders fetched messages once loading clears", () => {
    useChatStore.getState().setMessagesForAgent("greeting_agent", [
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello there" },
    ]);
    useChatStore.getState().setHistoryLoading(false);

    render(<MessageList />);

    expect(screen.getByText("hi")).toBeInTheDocument();
    expect(screen.getByText("hello there")).toBeInTheDocument();
    expect(screen.queryByText(/Loading conversation…/)).not.toBeInTheDocument();
  });
});
