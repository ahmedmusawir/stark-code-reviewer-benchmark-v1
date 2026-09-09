/**
 * speech — read-aloud text preparation + the v1 speech engine (FEAT-001).
 *
 * v2 SEED: this file is the ONLY place that touches a speech engine. v1 is
 * the browser's Web Speech API (zero backend, zero keys, robotic accepted).
 * A future premium-TTS v2 swaps the engine INSIDE speak()/stopSpeaking()
 * without touching any component. Do not import speechSynthesis anywhere else.
 *
 * Single-owner doctrine: at most one utterance plays at a time. A new speak()
 * cancels the previous one AND notifies its owner, so a message bubble's
 * speaker icon can never go stale when another message starts reading.
 */

/** SSR/support guard — server and unsupported browsers no-op everywhere. */
export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Markdown → speakable prose (ruled at plan review):
 * fenced code blocks are ANNOUNCED as "Code block skipped." (never read);
 * inline code is spoken as its bare text; links/URLs collapse to the domain;
 * markdown syntax is stripped so no "asterisk asterisk" is ever spoken.
 */
export function prepareSpeechText(markdown: string): string {
  let text = markdown;

  // Fenced code blocks first (before inline-backtick handling). Unterminated
  // trailing fences (mid-stream truncation) are skipped too.
  text = text.replace(/```[\s\S]*?```/g, " Code block skipped. ");
  text = text.replace(/```[\s\S]*$/, " Code block skipped. ");

  // Images → alt text; links → "label (domain)"; bare URLs → domain.
  text = text.replace(/!\[([^\]]*)\]\(([^)]*)\)/g, "$1");
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, label: string, url: string) => `${label} (${domainOf(url)})`,
  );
  text = text.replace(/https?:\/\/[^\s)]+/g, (url) => domainOf(url));

  // Inline code → bare text.
  text = text.replace(/`([^`]+)`/g, "$1");

  // Line-start syntax: headings, blockquotes, list markers, hr.
  text = text.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  text = text.replace(/^\s{0,3}>\s?/gm, "");
  text = text.replace(/^\s*[-*+]\s+/gm, "");
  text = text.replace(/^\s*\d+\.\s+/gm, "");
  text = text.replace(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/gm, "");

  // Emphasis: bold before italic so ** unwraps cleanly; strikethrough.
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
  text = text.replace(/\*([^*\n]+)\*/g, "$1");
  text = text.replace(/~~(.*?)~~/g, "$1");

  // Table plumbing: separator rows vanish, pipes become pauses.
  // NOTE: written as alternation, not a character class — Tailwind's content
  // scanner treats bracketed prop:value-shaped tokens in ANY scanned source
  // file as arbitrary-property class candidates and emits broken CSS.
  text = text.replace(/^\s*(?:\||-|:|\s)+$/gm, "");
  text = text.replace(/\|/g, ", ");

  return text.replace(/\s+/g, " ").trim();
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

type SpeakingListener = (speaking: boolean) => void;

// The single owner: whichever caller most recently started speech.
let currentListener: SpeakingListener | null = null;

/**
 * Speak `text`, canceling any in-flight speech first (its owner is notified
 * with `false`). The caller's listener receives `true` on start and `false`
 * when speech ends, errors, or is canceled by anyone.
 */
export function speak(text: string, onStateChange: SpeakingListener): void {
  if (!isSpeechSupported()) return;
  stopSpeaking();

  const utterance = new window.SpeechSynthesisUtterance(text);
  currentListener = onStateChange;
  const finish = () => {
    if (currentListener === onStateChange) currentListener = null;
    onStateChange(false);
  };
  utterance.onend = finish;
  utterance.onerror = finish;
  window.speechSynthesis.speak(utterance);
  onStateChange(true);
}

/** Cancel any in-flight speech and notify its owner. Safe to call anytime. */
export function stopSpeaking(): void {
  if (!isSpeechSupported()) return;
  const previous = currentListener;
  currentListener = null;
  window.speechSynthesis.cancel();
  if (previous) previous(false);
}
