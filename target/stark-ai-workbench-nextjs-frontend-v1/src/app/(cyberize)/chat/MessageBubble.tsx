"use client";

import { useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useTheme } from "next-themes";
import { Check, Copy } from "lucide-react";

import type { AgentName, Message } from "@/types";

import MessageActions from "./MessageActions";

interface MessageBubbleProps {
  message: Message;
  agentName: AgentName;
  isLast?: boolean;
  onEdit?: () => void;
  onRegenerate?: () => void;
  onFeedback?: (direction: "up" | "down") => void;
}

export const MessageBubble = ({
  message,
  agentName,
  isLast,
  onEdit,
  onRegenerate,
  onFeedback,
}: MessageBubbleProps) => {
  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div className="max-w-prose px-4 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 text-sm whitespace-pre-wrap">
          {message.content}
        </div>
        <MessageActions
          role="user"
          content={message.content}
          onEdit={onEdit}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {agentName}
      </p>
      <AssistantMarkdown content={message.content} />
      <MessageActions
        role="assistant"
        content={message.content}
        isLast={isLast}
        onRegenerate={onRegenerate}
        onFeedback={onFeedback}
      />
    </div>
  );
};

/* ───────────────────────────── Assistant Markdown ───────────────────────────── */

const AssistantMarkdown = ({ content }: { content: string }) => {
  const { resolvedTheme } = useTheme();
  const codeTheme = resolvedTheme === "dark" ? oneDark : oneLight;

  const components: Components = {
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || "");
      if (match) {
        const codeText = String(children).replace(/\n$/, "");
        return (
          <div className="relative my-2 group">
            <CopyCodeButton text={codeText} />
            <SyntaxHighlighter
              // react-syntax-highlighter's style prop has loose typing; the
              // imported theme objects don't satisfy its strict shape.
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              style={codeTheme as any}
              language={match[1]}
              PreTag="div"
              customStyle={{
                borderRadius: "0.5rem",
                fontSize: "0.85rem",
                margin: 0,
                padding: "1rem",
              }}
            >
              {codeText}
            </SyntaxHighlighter>
          </div>
        );
      }
      return (
        <code
          className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-600 text-zinc-800 dark:text-zinc-200 text-[0.85em] font-mono"
          {...props}
        >
          {children}
        </code>
      );
    },
    table: ({ children }) => (
      <div className="overflow-x-auto my-3">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-zinc-50 dark:bg-zinc-800">{children}</thead>
    ),
    th: ({ children }) => (
      <th className="border border-zinc-200 dark:border-zinc-600 px-3 py-2 text-left font-medium">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-zinc-200 dark:border-zinc-600 px-3 py-2">
        {children}
      </td>
    ),
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline"
      >
        {children}
      </a>
    ),
    p: ({ children }) => (
      <p className="text-zinc-900 dark:text-zinc-100 leading-relaxed">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside space-y-1 text-zinc-900 dark:text-zinc-100">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside space-y-1 text-zinc-900 dark:text-zinc-100">
        {children}
      </ol>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em className="italic text-zinc-900 dark:text-zinc-100">{children}</em>
    ),
  };

  return (
    <div className="text-sm space-y-2">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

/* ─────────────────────────── Copy code button (inline) ─────────────────────────── */

function CopyCodeButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — silent fail
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy code"}
      title={copied ? "Copied" : "Copy code"}
      className="absolute top-2 right-2 z-10 h-7 px-2 flex items-center gap-1 rounded text-xs font-medium bg-white/80 dark:bg-zinc-800/80 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 backdrop-blur-sm border border-zinc-200/60 dark:border-zinc-600/60 transition-colors"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
