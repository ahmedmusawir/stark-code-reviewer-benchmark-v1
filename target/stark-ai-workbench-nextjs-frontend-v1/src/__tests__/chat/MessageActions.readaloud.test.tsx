/**
 * @jest-environment jsdom
 */

/**
 * FEAT-001 — read-aloud wiring in MessageActions (gates V1/V2).
 * Intent (Rule K9): the speaker button speaks CLEANED text through the
 * utility, toggles stop, hands ownership across bubbles (starting B stops A
 * and reverts A's icon), and cancels on unmount. speechSynthesis mocked.
 */

import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MessageActions from "@/app/(cyberize)/chat/MessageActions";

type MockUtterance = {
  text: string;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

describe("MessageActions read-aloud (FEAT-001)", () => {
  const speakMock = jest.fn();
  const cancelMock = jest.fn();

  beforeEach(() => {
    speakMock.mockClear();
    cancelMock.mockClear();
    Object.defineProperty(window, "speechSynthesis", {
      value: { speak: speakMock, cancel: cancelMock },
      configurable: true,
      writable: true,
    });
    (window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance =
      class {
        text: string;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(text: string) {
          this.text = text;
        }
      };
  });

  it("speaks CLEANED text — no markdown symbols, code announced as skipped (V2)", async () => {
    const user = userEvent.setup();
    render(
      <MessageActions
        role="assistant"
        content={"**Bold** intro\n```js\nlet x = 1;\n```"}
      />,
    );

    await user.click(screen.getByRole("button", { name: /read aloud/i }));

    expect(speakMock).toHaveBeenCalledTimes(1);
    const utterance = speakMock.mock.calls[0][0] as MockUtterance;
    expect(utterance.text).toContain("Bold intro");
    expect(utterance.text).toContain("Code block skipped.");
    expect(utterance.text).not.toContain("**");
    expect(utterance.text).not.toContain("let x = 1");
  });

  it("toggles: click while speaking stops and reverts the label (V1)", async () => {
    const user = userEvent.setup();
    render(<MessageActions role="assistant" content="hello world" />);

    await user.click(screen.getByRole("button", { name: /read aloud/i }));
    expect(
      screen.getByRole("button", { name: /stop reading/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /stop reading/i }));
    expect(cancelMock).toHaveBeenCalled();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /read aloud/i }),
      ).toBeInTheDocument();
    });
  });

  it("starting message B stops message A and reverts A's icon (V1)", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid="a">
          <MessageActions role="assistant" content="message A" />
        </div>
        <div data-testid="b">
          <MessageActions role="assistant" content="message B" />
        </div>
      </div>,
    );

    const withinA = (name: RegExp) =>
      screen
        .getAllByRole("button", { name })
        .find((el) => el.closest("[data-testid='a']"));

    await user.click(withinA(/read aloud/i) as HTMLElement);
    expect(
      screen.getAllByRole("button", { name: /stop reading/i }),
    ).toHaveLength(1);

    // Start B while A is speaking
    await user.click(screen.getByRole("button", { name: /read aloud/i }));

    expect(cancelMock).toHaveBeenCalled();
    await waitFor(() => {
      // Exactly ONE stop-reading button — B's; A reverted.
      const stops = screen.getAllByRole("button", { name: /stop reading/i });
      expect(stops).toHaveLength(1);
      expect(stops[0].closest("[data-testid='b']")).not.toBeNull();
    });
  });

  it("cancels speech when the speaking message unmounts (V1 cleanup)", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <MessageActions role="assistant" content="soon gone" />,
    );

    await user.click(screen.getByRole("button", { name: /read aloud/i }));
    cancelMock.mockClear();

    unmount();
    expect(cancelMock).toHaveBeenCalled();
  });
});
