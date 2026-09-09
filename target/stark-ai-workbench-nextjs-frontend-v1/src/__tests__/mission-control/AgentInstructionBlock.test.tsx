/**
 * @jest-environment jsdom
 */

/**
 * AgentInstructionBlock tests — Phase 7.
 *
 * Intent (Rule K9): verify the orchestration of the editor block — fetch on
 * mount, save calls service + toast on success, inline alert on failure.
 * The mock instructionsService stands in for what Phase 2-of-overall-lifecycle
 * will swap to a real GCS read/write.
 */

import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockFetchInstructions = jest.fn();
const mockUpdateInstructions = jest.fn();
const mockToast = jest.fn();

jest.mock("@/services/instructionsService", () => ({
  instructionsService: {
    fetchInstructions: (agent: string) => mockFetchInstructions(agent),
    updateInstructions: (agent: string, content: string) =>
      mockUpdateInstructions(agent, content),
  },
}));

jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

import AgentInstructionBlock from "@/app/(cyberize)/mission-control/AgentInstructionBlock";

describe("AgentInstructionBlock", () => {
  beforeEach(() => {
    mockFetchInstructions.mockReset();
    mockUpdateInstructions.mockReset();
    mockToast.mockReset();
    mockFetchInstructions.mockResolvedValue(
      "Existing instructions for greeting_agent.",
    );
    mockUpdateInstructions.mockResolvedValue(undefined);
  });

  it("renders the 'Instructions for:' header with the agent name", () => {
    render(<AgentInstructionBlock agentName="greeting_agent" />);
    expect(screen.getByText(/instructions for/i)).toBeInTheDocument();
    expect(screen.getByText("greeting_agent")).toBeInTheDocument();
  });

  it("fetches initial instructions on mount via instructionsService", async () => {
    render(<AgentInstructionBlock agentName="greeting_agent" />);
    await waitFor(() => {
      expect(mockFetchInstructions).toHaveBeenCalledWith("greeting_agent");
    });
    await waitFor(() => {
      expect(
        screen.getByDisplayValue("Existing instructions for greeting_agent."),
      ).toBeInTheDocument();
    });
  });

  it("calls updateInstructions on save and toasts success", async () => {
    const user = userEvent.setup();
    render(<AgentInstructionBlock agentName="greeting_agent" />);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("Existing instructions for greeting_agent."),
      ).toBeInTheDocument();
    });

    const textarea = screen.getByDisplayValue(
      "Existing instructions for greeting_agent.",
    );
    await user.clear(textarea);
    await user.type(textarea, "New text");

    await user.click(
      screen.getByRole("button", { name: /save for greeting_agent/i }),
    );

    await waitFor(() => {
      expect(mockUpdateInstructions).toHaveBeenCalledWith(
        "greeting_agent",
        "New text",
      );
    });
    expect(mockToast).toHaveBeenCalledWith({
      title: "Saved",
      description: "Instructions for greeting_agent updated.",
    });
  });

  it("shows an inline alert on save failure", async () => {
    mockUpdateInstructions.mockRejectedValueOnce(new Error("network down"));
    const user = userEvent.setup();
    render(<AgentInstructionBlock agentName="greeting_agent" />);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue(/Existing instructions/i),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /save for greeting_agent/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/network down/i);
    });
  });
});
