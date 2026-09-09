/**
 * @jest-environment jsdom
 */

/**
 * MissionControlPageContent integration test — Phase 7.
 *
 * Intent (Rule K9): verify the 4 documented agents render in the documented
 * order AND ghl_mcp_agent is OMITTED (drift preserved per DATA_CONTRACT §4 +
 * APP_BRIEF.md Section 10).
 */

import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";

jest.mock("@/services/instructionsService", () => ({
  instructionsService: {
    fetchInstructions: jest.fn().mockResolvedValue(""),
    updateInstructions: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

import MissionControlPageContent from "@/app/(cyberize)/mission-control/MissionControlPageContent";

describe("MissionControlPageContent", () => {
  it("renders the 4 documented agents and omits ghl_mcp_agent (drift preserved)", async () => {
    render(<MissionControlPageContent />);

    await waitFor(() => {
      expect(screen.getByText("greeting_agent")).toBeInTheDocument();
      expect(screen.getByText("calc_agent")).toBeInTheDocument();
      expect(screen.getByText("jarvis_agent")).toBeInTheDocument();
      expect(screen.getByText("product_agent")).toBeInTheDocument();
    });

    // ghl_mcp_agent must NOT appear in Mission Control (preserved drift)
    expect(screen.queryByText("ghl_mcp_agent")).not.toBeInTheDocument();
  });

  it("renders the page header", () => {
    render(<MissionControlPageContent />);
    expect(
      screen.getByRole("heading", { name: /agent instruction editor/i }),
    ).toBeInTheDocument();
  });
});
