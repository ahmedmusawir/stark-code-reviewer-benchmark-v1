/**
 * @jest-environment jsdom
 */

/**
 * Intent (Rule K9): verify the assistant variant renders markdown including
 * the CANONICAL contacts table (the ghl_mcp_agent test case from Phase 3
 * mocks). If this test passes, markdown table rendering is wired correctly
 * for Phase 5 — which is the whole point of installing remark-gfm.
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

import { MessageBubble } from "@/app/(cyberize)/chat/MessageBubble";

describe("MessageBubble", () => {
  it("renders user message content (right-pill variant)", () => {
    render(
      <MessageBubble
        message={{ role: "user", content: "Hello world" }}
        agentName="greeting_agent"
      />,
    );
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders assistant message with agent name label", () => {
    render(
      <MessageBubble
        message={{ role: "assistant", content: "Hi there" }}
        agentName="greeting_agent"
      />,
    );
    expect(screen.getByText(/greeting_agent/i)).toBeInTheDocument();
    expect(screen.getByText("Hi there")).toBeInTheDocument();
  });

  it("renders assistant markdown bold and italic via remark-gfm", () => {
    render(
      <MessageBubble
        message={{
          role: "assistant",
          content: "**bold text** and *italic text*",
        }}
        agentName="greeting_agent"
      />,
    );
    expect(screen.getByText("bold text").tagName).toBe("STRONG");
    expect(screen.getByText("italic text").tagName).toBe("EM");
  });

  it("renders assistant markdown TABLE (canonical case for Phase 5)", () => {
    const content =
      "| Name | Email |\n|------|-------|\n| Alex | alex@example.com |";
    render(
      <MessageBubble
        message={{ role: "assistant", content }}
        agentName="ghl_mcp_agent"
      />,
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("alex@example.com")).toBeInTheDocument();
  });

  it("renders assistant markdown code block with language tag", () => {
    const content = "```python\nprint('hello')\n```";
    render(
      <MessageBubble
        message={{ role: "assistant", content }}
        agentName="calc_agent"
      />,
    );
    // SyntaxHighlighter renders tokens; assert the print keyword appears
    expect(screen.getByText(/print/)).toBeInTheDocument();
  });
});
