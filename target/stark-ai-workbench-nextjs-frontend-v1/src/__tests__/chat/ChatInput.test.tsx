/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

interface MockSlice {
  isLoading: boolean;
  selectedAgent: string;
}

let mockState: MockSlice = {
  isLoading: false,
  selectedAgent: "greeting_agent",
};

jest.mock("@/store/chatStore", () => ({
  useChatStore: (selector: (state: MockSlice) => unknown) => selector(mockState),
}));

import { ChatInput } from "@/app/(cyberize)/chat/ChatInput";

describe("ChatInput", () => {
  beforeEach(() => {
    mockState = { isLoading: false, selectedAgent: "greeting_agent" };
  });

  it("calls onSubmit with the trimmed value when Enter is pressed", async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(<ChatInput onSubmit={onSubmit} />);
    const input = screen.getByPlaceholderText(/ask greeting_agent/i);
    await user.type(input, "Hello{Enter}");
    expect(onSubmit).toHaveBeenCalledWith("Hello");
  });

  it("clears the input after submit", async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(<ChatInput onSubmit={onSubmit} />);
    const input = screen.getByPlaceholderText(
      /ask greeting_agent/i,
    ) as HTMLTextAreaElement;
    await user.type(input, "Hello{Enter}");
    expect(input.value).toBe("");
  });

  it("does not submit empty messages", async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(<ChatInput onSubmit={onSubmit} />);
    const input = screen.getByPlaceholderText(/ask greeting_agent/i);
    await user.type(input, "{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables the textarea while isLoading is true", () => {
    mockState = { isLoading: true, selectedAgent: "greeting_agent" };
    render(<ChatInput onSubmit={jest.fn()} />);
    expect(screen.getByPlaceholderText(/ask greeting_agent/i)).toBeDisabled();
  });
});
