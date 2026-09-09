/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockSetSelectedAgent = jest.fn();

interface MockSlice {
  selectedAgent: string;
  setSelectedAgent: typeof mockSetSelectedAgent;
}

let mockState: MockSlice = {
  selectedAgent: "greeting_agent",
  setSelectedAgent: mockSetSelectedAgent,
};

jest.mock("@/store/chatStore", () => ({
  useChatStore: (selector: (state: MockSlice) => unknown) => selector(mockState),
}));

import { AgentSwitcher } from "@/components/chat/AgentSwitcher";
import { agentsForUi } from "@/config/manifest";

describe("AgentSwitcher", () => {
  beforeEach(() => {
    mockSetSelectedAgent.mockReset();
    mockState = {
      selectedAgent: "greeting_agent",
      setSelectedAgent: mockSetSelectedAgent,
    };
  });

  // BIM-003 (M-G7 sanctioned edit): buttons render the manifest LABELS, not
  // raw agent names — the sidebar is manifest-driven now.
  it("renders every manifest agent by its label", () => {
    render(<AgentSwitcher />);
    for (const item of agentsForUi()) {
      expect(
        screen.getByRole("button", { name: item.label }),
      ).toBeInTheDocument();
    }
    expect(screen.getAllByRole("button")).toHaveLength(agentsForUi().length);
  });

  it("calls setSelectedAgent with the agent NAME when its label is clicked", async () => {
    const user = userEvent.setup();
    render(<AgentSwitcher />);
    await user.click(screen.getByRole("button", { name: "Jarvis" }));
    expect(mockSetSelectedAgent).toHaveBeenCalledWith("jarvis_agent");
  });
});
