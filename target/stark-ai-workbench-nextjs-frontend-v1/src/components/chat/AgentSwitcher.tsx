"use client";

import { useRouter, usePathname } from "next/navigation";

import { agentsForUi } from "@/config/manifest";
import { useChatStore } from "@/store/chatStore";
import type { AgentName } from "@/types";

// BIM-003 (M4): the sidebar renders from the committed manifest — adding an
// agent is a JSON edit in config/agents.manifest.json, not a code change.
const AGENTS = agentsForUi();

export const AgentSwitcher = () => {
  const selectedAgent = useChatStore((state) => state.selectedAgent);
  const setSelectedAgent = useChatStore((state) => state.setSelectedAgent);
  const router = useRouter();
  const pathname = usePathname();

  const handleSelect = (agent: AgentName) => {
    setSelectedAgent(agent);
    // Clicking an agent always lands you in the chat surface. If you're on
    // mission-control or any other route, switch over.
    if (!pathname.startsWith("/chat")) {
      router.push("/chat");
    }
  };

  return (
    <div className="px-3 py-2 space-y-1">
      <p className="px-2 py-1 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Agents
      </p>
      {AGENTS.map(({ name, label }) => {
        const isActive = selectedAgent === name && pathname.startsWith("/chat");
        return (
          <button
            key={name}
            type="button"
            onClick={() => handleSelect(name)}
            className={
              "w-full text-left px-3 py-2 rounded-md text-sm font-mono transition-colors " +
              (isActive
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700/60")
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
