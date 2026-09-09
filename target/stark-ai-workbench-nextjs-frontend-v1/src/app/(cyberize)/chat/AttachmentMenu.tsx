"use client";

/**
 * AttachmentMenu — Plus-icon popover in the chat input.
 *
 * Uses kit's Shadcn DropdownMenu primitive (Radix-backed). Two options:
 *   - Upload file
 *   - Upload image
 *
 * Both are stubs in Phase 5.5 — callbacks fire but no actual upload logic.
 * Wire to real upload handlers when file storage backend is wired (Phase 2 of
 * overall lifecycle).
 */

import { ImageIcon, Paperclip, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AttachmentMenuProps {
  onUploadFile?: () => void;
  onUploadImage?: () => void;
  disabled?: boolean;
}

export default function AttachmentMenu({
  onUploadFile,
  onUploadImage,
  disabled,
}: AttachmentMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label="Add attachment"
          className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-600/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Plus size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" sideOffset={6} className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600">
        <DropdownMenuItem
          onClick={() => {
            // eslint-disable-next-line no-console
            console.info("[AttachmentMenu] upload file");
            onUploadFile?.();
          }}
          className="gap-2 cursor-pointer"
        >
          <Paperclip size={16} />
          <span>Upload file</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            // eslint-disable-next-line no-console
            console.info("[AttachmentMenu] upload image");
            onUploadImage?.();
          }}
          className="gap-2 cursor-pointer"
        >
          <ImageIcon size={16} />
          <span>Upload image</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
