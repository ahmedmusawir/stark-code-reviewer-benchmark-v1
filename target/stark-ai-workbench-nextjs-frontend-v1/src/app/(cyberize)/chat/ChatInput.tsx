"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, X } from "lucide-react";

import { useChatStore } from "@/store/chatStore";

import AttachmentMenu from "./AttachmentMenu";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  initialValue?: string;
  isEditing?: boolean;
  onCancelEdit?: () => void;
  onUploadFile?: () => void;
  onUploadImage?: () => void;
}

const MAX_TEXTAREA_HEIGHT_PX = 288; // ~12 rows at line-height 24px

export const ChatInput = ({
  onSubmit,
  initialValue,
  isEditing,
  onCancelEdit,
  onUploadFile,
  onUploadImage,
}: ChatInputProps) => {
  const [value, setValue] = useState(initialValue ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = useChatStore((s) => s.isLoading);
  const selectedAgent = useChatStore((s) => s.selectedAgent);

  // Auto-grow textarea — clamp to ~12 rows
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT_PX)}px`;
  }, [value]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setValue("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape" && isEditing) {
      e.preventDefault();
      onCancelEdit?.();
    }
  };

  return (
    <div className="px-3 md:px-6 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        {isEditing && (
          <div className="flex items-center justify-between mb-2 px-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>Editing message — submit to replace, Esc to cancel</span>
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100"
              aria-label="Cancel edit"
            >
              <X size={14} />
              <span>Cancel</span>
            </button>
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 p-2 focus-within:ring-2 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-100 transition-shadow"
        >
          <AttachmentMenu
            onUploadFile={onUploadFile}
            onUploadImage={onUploadImage}
            disabled={isLoading}
          />
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={`Ask ${selectedAgent}...`}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none px-2 py-1.5 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoading || !value.trim()}
            aria-label="Send message"
            className="h-8 w-8 flex items-center justify-center rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <ArrowUp size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
