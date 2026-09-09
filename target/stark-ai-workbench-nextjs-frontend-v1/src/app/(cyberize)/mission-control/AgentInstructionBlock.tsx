"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { instructionsService } from "@/services/instructionsService";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { AgentName } from "@/types";

interface AgentInstructionBlockProps {
  agentName: AgentName;
}

/**
 * AgentInstructionBlock — co-located component used only by MissionControlPageContent.
 *
 * Fetches the agent's current instruction blob on mount, lets the operator
 * edit, saves via instructionsService. Success → toast. Failure → inline Alert.
 *
 * Phase 7. Per-agent editor block; 4 instances rendered by the page.
 */
export default function AgentInstructionBlock({
  agentName,
}: AgentInstructionBlockProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load initial instructions on mount
  useEffect(() => {
    let cancelled = false;
    instructionsService
      .fetchInstructions(agentName)
      .then((blob) => {
        if (cancelled) return;
        setContent(blob);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        // Preserve Streamlit-original behavior per DATA_CONTRACT §1.11 — show
        // an error string in the textarea on fetch failure
        setContent(
          `Error: Could not load instructions for ${agentName}. ${err.message}`,
        );
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agentName]);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await instructionsService.updateInstructions(agentName, content);
      toast({
        title: "Saved",
        description: `Instructions for ${agentName} updated.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed.";
      setError(`Failed to update instructions for ${agentName}: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 p-4 md:p-6 space-y-3">
      <div className="flex items-center flex-wrap gap-2">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Instructions for:
        </h2>
        <code className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-mono text-sm">
          {agentName}
        </code>
      </div>

      <label
        htmlFor={`instructions-${agentName}`}
        className="block text-sm text-zinc-500 dark:text-zinc-400"
      >
        Modify instructions:
      </label>

      <textarea
        id={`instructions-${agentName}`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isLoading || isSaving}
        placeholder={isLoading ? "Loading..." : ""}
        className="w-full h-[250px] resize-y rounded-md border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition-shadow font-mono disabled:opacity-60"
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="button"
        onClick={handleSave}
        disabled={isLoading || isSaving}
        className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          `Save for ${agentName}`
        )}
      </Button>
    </div>
  );
}
