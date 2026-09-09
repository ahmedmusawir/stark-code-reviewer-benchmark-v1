"use client";

/**
 * MessageActions — Action button bar under each message.
 *
 * Variants:
 *   - assistant: Copy / Read Aloud / 👍 / 👎 / Regenerate (Regenerate only if isLast)
 *   - user:      Copy / Edit
 *
 * All actions are functional today:
 *   - Copy:       navigator.clipboard.writeText + 2s "Copied!" flash
 *   - Read Aloud: window.speechSynthesis (browser-native, no dep)
 *   - 👍 / 👎:    console.info logger today; clean callback hook for future feedback endpoint
 *   - Regenerate: callback to parent (ChatPageContent re-runs sendMessage)
 *   - Edit:       callback to parent (ChatPageContent opens input with prefill + truncates on submit)
 *
 * Mobile-first (Lesson 6): visible buttons are h-9 with generous spacing; comfortable touch.
 */

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Pencil,
  RotateCw,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  VolumeX,
} from "lucide-react";

import {
  isSpeechSupported,
  prepareSpeechText,
  speak,
  stopSpeaking,
} from "@/utils/speech";

interface MessageActionsProps {
  role: "user" | "assistant";
  content: string;
  isLast?: boolean;
  onEdit?: () => void;
  onRegenerate?: () => void;
  onFeedback?: (direction: "up" | "down") => void;
}

export default function MessageActions({
  role,
  content,
  isLast,
  onEdit,
  onRegenerate,
  onFeedback,
}: MessageActionsProps) {
  const isAssistant = role === "assistant";

  return (
    <div
      className={
        "flex items-center gap-0.5 text-zinc-500 dark:text-zinc-400 " +
        (isAssistant ? "" : "justify-end")
      }
    >
      <CopyButton content={content} />
      {isAssistant && <ReadAloudButton content={content} />}
      {isAssistant && (
        <FeedbackButton
          direction="up"
          onClick={() => onFeedback?.("up")}
        />
      )}
      {isAssistant && (
        <FeedbackButton
          direction="down"
          onClick={() => onFeedback?.("down")}
        />
      )}
      {isAssistant && isLast && onRegenerate && (
        <ActionButton
          label="Regenerate response"
          onClick={onRegenerate}
        >
          <RotateCw size={15} />
        </ActionButton>
      )}
      {!isAssistant && onEdit && (
        <ActionButton label="Edit message" onClick={onEdit}>
          <Pencil size={15} />
        </ActionButton>
      )}
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

function ActionButton({
  label,
  onClick,
  disabled,
  children,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="h-9 w-9 flex items-center justify-center rounded-md hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-600/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be unavailable in some contexts (HTTP, restricted browsers)
      // fail silently — user can copy manually
    }
  };
  return (
    <ActionButton
      label={copied ? "Copied" : "Copy"}
      onClick={handleCopy}
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
    </ActionButton>
  );
}

function ReadAloudButton({ content }: { content: string }) {
  const [speaking, setSpeaking] = useState(false);
  // Ref mirrors `speaking` so the unmount cleanup sees the live value, and
  // the utility's owner-callback can never leave this icon stale.
  const speakingRef = useRef(false);
  const supported = isSpeechSupported();

  const handleStateChange = (isSpeaking: boolean) => {
    speakingRef.current = isSpeaking;
    setSpeaking(isSpeaking);
  };

  // FEAT-001: cancel our own speech if this message unmounts mid-read
  // (navigation, thread truncation).
  useEffect(() => {
    return () => {
      if (speakingRef.current) stopSpeaking();
    };
  }, []);

  const handleClick = () => {
    if (!supported) return;
    if (speaking) {
      stopSpeaking(); // notifies us via the owner callback
      return;
    }
    // Cleaned prose only: markdown stripped, code blocks announced as
    // skipped, URLs collapsed to domains (FEAT-001 plan rulings).
    speak(prepareSpeechText(content), handleStateChange);
  };

  return (
    <ActionButton
      label={speaking ? "Stop reading" : "Read aloud"}
      onClick={handleClick}
      disabled={!supported}
    >
      {speaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
    </ActionButton>
  );
}

function FeedbackButton({
  direction,
  onClick,
}: {
  direction: "up" | "down";
  onClick: () => void;
}) {
  const [clicked, setClicked] = useState(false);
  const handleClick = () => {
    setClicked(true);
    // eslint-disable-next-line no-console
    console.info(`[MessageActions] feedback: ${direction}`);
    onClick();
    window.setTimeout(() => setClicked(false), 1500);
  };
  const label = direction === "up" ? "Good response" : "Bad response";
  return (
    <ActionButton label={label} onClick={handleClick}>
      <span
        className={
          clicked ? "text-zinc-900 dark:text-zinc-100" : "text-current"
        }
      >
        {direction === "up" ? <ThumbsUp size={15} /> : <ThumbsDown size={15} />}
      </span>
    </ActionButton>
  );
}
