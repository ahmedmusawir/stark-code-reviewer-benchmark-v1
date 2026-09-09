"use client";

import type { AgentName } from "@/types";

import AgentInstructionBlock from "./AgentInstructionBlock";

/**
 * Per `_project/DATA_CONTRACT.md` §4: Mission Control hardcodes 4 agents in
 * this exact order. ghl_mcp_agent is deliberately omitted — preserving the
 * drift from the Streamlit original per APP_BRIEF.md Section 10.
 */
const MISSION_CONTROL_AGENTS: AgentName[] = [
  "greeting_agent",
  "calc_agent",
  "jarvis_agent",
  "product_agent",
];

export default function MissionControlPageContent() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-3 md:px-6 py-6 space-y-6">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-2">
            MISSION CONTROL
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Agent instruction editor
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Update agent instructions in real-time. Saves to mock storage today;
            real GCS persistence comes in the backend swap phase.
          </p>
        </div>

        <div className="space-y-4">
          {MISSION_CONTROL_AGENTS.map((agent) => (
            <AgentInstructionBlock key={agent} agentName={agent} />
          ))}
        </div>
      </div>
    </div>
  );
}
