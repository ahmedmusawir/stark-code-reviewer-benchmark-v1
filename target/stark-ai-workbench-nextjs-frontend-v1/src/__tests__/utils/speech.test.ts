/**
 * @jest-environment jsdom
 */

/**
 * FEAT-001 — speech utility (gates V1/V2/V7).
 * Intent (Rule K9): prepareSpeechText produces speakable prose (no markdown
 * symbols spoken, code announced as skipped, URLs collapse to domains), and
 * the single-owner engine cancels the previous utterance and notifies its
 * owner. Engine mocked — no real audio in jsdom.
 */

import {
  isSpeechSupported,
  prepareSpeechText,
  speak,
  stopSpeaking,
} from "@/utils/speech";

describe("prepareSpeechText (V2)", () => {
  it("strips bold/italic/heading/blockquote syntax", () => {
    const spoken = prepareSpeechText(
      "# Title\n> quoted\n**bold** and *italic* and __also bold__",
    );
    expect(spoken).toBe("Title quoted bold and italic and also bold");
    expect(spoken).not.toMatch(/[*#>_]/);
  });

  it("announces fenced code blocks and never speaks their contents", () => {
    const spoken = prepareSpeechText(
      "Here is the fix:\n```ts\nconst secret = 42;\n```\nDone.",
    );
    expect(spoken).toContain("Code block skipped.");
    expect(spoken).not.toContain("const secret");
    expect(spoken).not.toContain("```");
  });

  it("announces an unterminated trailing fence (mid-stream truncation)", () => {
    const spoken = prepareSpeechText("Look:\n```python\nprint('hi')");
    expect(spoken).toContain("Code block skipped.");
    expect(spoken).not.toContain("print");
  });

  it("speaks inline code as bare text", () => {
    expect(prepareSpeechText("run `npm test` locally")).toBe(
      "run npm test locally",
    );
  });

  it("collapses links to 'label (domain)' and bare URLs to the domain", () => {
    expect(
      prepareSpeechText("see [the docs](https://www.example.com/a/b/c)"),
    ).toBe("see the docs (example.com)");
    expect(prepareSpeechText("visit https://docs.google.com/x/y now")).toBe(
      "visit docs.google.com now",
    );
  });

  it("flattens tables: separator rows vanish, pipes become pauses", () => {
    const spoken = prepareSpeechText(
      "| Name | Role |\n|------|------|\n| Tony | Boss |",
    );
    expect(spoken).not.toContain("|");
    expect(spoken).not.toContain("---");
    expect(spoken).toContain("Tony");
  });

  it("strips list markers", () => {
    expect(prepareSpeechText("- first\n- second\n1. third")).toBe(
      "first second third",
    );
  });
});

describe("speech engine (V1 single-owner)", () => {
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
    stopSpeaking(); // clear any owner left by a prior test
    cancelMock.mockClear();
  });

  it("reports supported in jsdom with the mock installed", () => {
    expect(isSpeechSupported()).toBe(true);
  });

  it("speak() starts the utterance and notifies the owner with true", () => {
    const listener = jest.fn();
    speak("hello", listener);
    expect(speakMock).toHaveBeenCalledTimes(1);
    expect(speakMock.mock.calls[0][0].text).toBe("hello");
    expect(listener).toHaveBeenLastCalledWith(true);
  });

  it("a new speak() cancels the previous one AND notifies its owner (V1)", () => {
    const first = jest.fn();
    const second = jest.fn();
    speak("first message", first);
    speak("second message", second);

    expect(cancelMock).toHaveBeenCalled();
    expect(first).toHaveBeenLastCalledWith(false);
    expect(second).toHaveBeenLastCalledWith(true);
  });

  it("stopSpeaking() cancels and notifies the current owner", () => {
    const listener = jest.fn();
    speak("hello", listener);
    stopSpeaking();
    expect(cancelMock).toHaveBeenCalled();
    expect(listener).toHaveBeenLastCalledWith(false);
  });

  it("utterance end notifies the owner with false", () => {
    const listener = jest.fn();
    speak("hello", listener);
    speakMock.mock.calls[0][0].onend();
    expect(listener).toHaveBeenLastCalledWith(false);
  });

  it("no-ops without throwing when speechSynthesis is unavailable (V7)", () => {
    // Simulate the guard failing (server / unsupported browser).
    delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
    expect(isSpeechSupported()).toBe(false);
    expect(() => speak("hello", jest.fn())).not.toThrow();
    expect(() => stopSpeaking()).not.toThrow();
  });
});
