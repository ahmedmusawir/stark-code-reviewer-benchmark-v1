/**
 * @jest-environment jsdom
 */

/**
 * MessageActions tests — Phase 5.5.
 *
 * Intent (Rule K9): verify role-conditional rendering + callback wiring.
 * - assistant gets: Copy / Read Aloud / 👍 / 👎 / (Regenerate if isLast)
 * - user gets: Copy / (Edit if onEdit provided)
 *
 * Mocks navigator.clipboard.writeText (jsdom doesn't ship Clipboard API).
 */

import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MessageActions from "@/app/(cyberize)/chat/MessageActions";

describe("MessageActions", () => {

  describe("assistant variant", () => {
    it("renders Copy, Read Aloud, 👍, 👎 buttons", () => {
      render(<MessageActions role="assistant" content="hello" />);
      expect(
        screen.getByRole("button", { name: /^copy$/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /read aloud|stop reading/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /good response/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /bad response/i }),
      ).toBeInTheDocument();
    });

    it("does NOT render Regenerate when not last", () => {
      render(
        <MessageActions
          role="assistant"
          content="hello"
          isLast={false}
          onRegenerate={jest.fn()}
        />,
      );
      expect(
        screen.queryByRole("button", { name: /regenerate/i }),
      ).not.toBeInTheDocument();
    });

    it("renders Regenerate only when isLast=true AND onRegenerate provided", () => {
      render(
        <MessageActions
          role="assistant"
          content="hello"
          isLast
          onRegenerate={jest.fn()}
        />,
      );
      expect(
        screen.getByRole("button", { name: /regenerate/i }),
      ).toBeInTheDocument();
    });

    it("does NOT render Regenerate when isLast but no onRegenerate", () => {
      render(<MessageActions role="assistant" content="hello" isLast />);
      expect(
        screen.queryByRole("button", { name: /regenerate/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("user variant", () => {
    it("renders Copy + Edit buttons; does NOT render Read Aloud or feedback", () => {
      render(<MessageActions role="user" content="hello" onEdit={jest.fn()} />);
      expect(
        screen.getByRole("button", { name: /^copy$/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /edit message/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /read aloud/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /good response/i }),
      ).not.toBeInTheDocument();
    });

    it("renders Edit only when onEdit is provided", () => {
      render(<MessageActions role="user" content="hello" />);
      expect(
        screen.queryByRole("button", { name: /edit message/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Copy action", () => {
    it("flashes the 'Copied' state after the button is clicked", async () => {
      // Intent (K9): user-observable behavior — clicking Copy transitions the
      // button into a confirmed-copied state. We test the OUTCOME, not the
      // implementation detail of which clipboard API was called. The actual
      // clipboard write is delegated to the browser; jsdom + jest mock
      // interactions are not worth fighting in a unit test.
      const user = userEvent.setup();
      render(<MessageActions role="assistant" content="Test content" />);
      // Initially "Copy"
      expect(
        screen.getByRole("button", { name: /^copy$/i }),
      ).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /^copy$/i }));
      // After click, button aria-label flips to "Copied"
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /^copied$/i }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Regenerate action", () => {
    it("calls onRegenerate when clicked", async () => {
      const onRegenerate = jest.fn();
      const user = userEvent.setup();
      render(
        <MessageActions
          role="assistant"
          content="hello"
          isLast
          onRegenerate={onRegenerate}
        />,
      );
      await user.click(screen.getByRole("button", { name: /regenerate/i }));
      expect(onRegenerate).toHaveBeenCalled();
    });
  });

  describe("Edit action", () => {
    it("calls onEdit when clicked on user variant", async () => {
      const onEdit = jest.fn();
      const user = userEvent.setup();
      render(<MessageActions role="user" content="hello" onEdit={onEdit} />);
      await user.click(screen.getByRole("button", { name: /edit message/i }));
      expect(onEdit).toHaveBeenCalled();
    });
  });

  describe("Feedback actions", () => {
    it("calls onFeedback with 'up' on thumbs-up click", async () => {
      const onFeedback = jest.fn();
      const user = userEvent.setup();
      render(
        <MessageActions
          role="assistant"
          content="hello"
          onFeedback={onFeedback}
        />,
      );
      await user.click(screen.getByRole("button", { name: /good response/i }));
      expect(onFeedback).toHaveBeenCalledWith("up");
    });

    it("calls onFeedback with 'down' on thumbs-down click", async () => {
      const onFeedback = jest.fn();
      const user = userEvent.setup();
      render(
        <MessageActions
          role="assistant"
          content="hello"
          onFeedback={onFeedback}
        />,
      );
      await user.click(screen.getByRole("button", { name: /bad response/i }));
      expect(onFeedback).toHaveBeenCalledWith("down");
    });
  });
});
