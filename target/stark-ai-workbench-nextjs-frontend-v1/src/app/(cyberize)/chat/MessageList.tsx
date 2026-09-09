"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ClipboardCopy } from "lucide-react";

import { useChatStore } from "@/store/chatStore";
import type { AgentName, Message } from "@/types";

import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  onEditUserMessage?: (index: number) => void;
  onRegenerate?: () => void;
  onFeedback?: (direction: "up" | "down", index: number) => void;
}

export const MessageList = ({
  onEditUserMessage,
  onRegenerate,
  onFeedback,
}: MessageListProps) => {
  const selectedAgent = useChatStore((s) => s.selectedAgent);
  const messages =
    useChatStore((s) => s.messagesByAgent[s.selectedAgent]) ?? [];
  const isLoading = useChatStore((s) => s.isLoading);
  const isHistoryLoading = useChatStore((s) => s.isHistoryLoading);
  const error = useChatStore((s) => s.error);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  // FIX-002b: while history is in flight, show the loading indicator instead
  // of the misleading "start the conversation" empty-state.
  if (isHistoryLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div
          className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 animate-pulse"
          role="status"
          aria-label="Loading conversation"
        >
          <span>Loading conversation…</span>
        </div>
      </div>
    );
  }

  if (messages.length === 0 && !isLoading && !error) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-xs font-medium tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-3">
            CYBERIZE
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Chat with{" "}
            <span className="font-mono text-zinc-700 dark:text-zinc-300">
              {selectedAgent}
            </span>
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Send a message to start the conversation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-3 md:px-6 py-6 space-y-6">
        {messages.length > 0 && (
          <div className="flex justify-end -mt-2">
            <CopyConversationButton
              messages={messages}
              agentName={selectedAgent}
            />
          </div>
        )}
        {messages.map((message, idx) => (
          <MessageBubble
            key={idx}
            message={message}
            agentName={selectedAgent}
            isLast={idx === messages.length - 1}
            onEdit={
              message.role === "user" && onEditUserMessage
                ? () => onEditUserMessage(idx)
                : undefined
            }
            onRegenerate={
              message.role === "assistant" &&
              idx === messages.length - 1 &&
              onRegenerate
                ? onRegenerate
                : undefined
            }
            onFeedback={
              onFeedback
                ? (direction) => onFeedback(direction, idx)
                : undefined
            }
          />
        ))}
        {isLoading && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {selectedAgent}
            </p>
            <ThinkingDots />
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md px-3 py-2"
          >
            {error}
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
};

const ThinkingDots = () => (
  <div
    className="flex gap-1.5 py-2"
    role="status"
    aria-label="Agent is thinking"
  >
    <span className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-pulse [animation-delay:0ms]" />
    <span className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-pulse [animation-delay:200ms]" />
    <span className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-pulse [animation-delay:400ms]" />
  </div>
);

function CopyConversationButton({
  messages,
  agentName,
}: {
  messages: Message[];
  agentName: AgentName;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const markdown = messages
      .map((m) => {
        const heading = m.role === "user" ? "## You" : `## ${agentName}`;
        return `${heading}\n\n${m.content}`;
      })
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent fail
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Conversation copied" : "Copy conversation as Markdown"}
      title="Copy conversation as Markdown"
      className="h-8 px-2.5 flex items-center gap-1.5 rounded-md text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-600/60 transition-colors"
    >
      {copied ? <Check size={13} /> : <ClipboardCopy size={13} />}
      <span>{copied ? "Copied" : "Copy conversation"}</span>
    </button>
  );
}
