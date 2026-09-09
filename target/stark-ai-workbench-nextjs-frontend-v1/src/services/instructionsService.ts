/**
 * instructionsService — mode-flagged (BIM-005).
 *
 * `NEXT_PUBLIC_CHAT_MODE=live` routes instruction reads/writes through the
 * internal /api/agent/instructions handlers to the live GCS bucket (with the
 * server enforcing backup-before-write). Any other value (or unset) keeps the
 * mock path — byte-identical to Phase 3 behavior. Method signatures frozen.
 *
 * @see _project/DATA_CONTRACT.md §2.4
 * @see agent_docs/CURRENT_APP/BIM005/CLAUDE.md
 */

import { mockInstructionsStore } from '@/mocks/data/instructions';
import type { AgentName, InstructionBlob } from '@/types';

const MOCK_DELAY_MS = 200;
const LIVE_TIMEOUT_MS = 30_000;

// Read at call time; Jest can flip the flag per-test (chatService pattern).
const isLive = () => process.env.NEXT_PUBLIC_CHAT_MODE === 'live';

export const instructionsService = {
  /**
   * Fetch the instruction blob for an agent.
   * Live: GET /api/agent/instructions — non-OK throws; the Mission Control
   * block renders the failure per DATA_CONTRACT §1.11.
   * Mock: returns the seeded per-agent instructions.
   */
  fetchInstructions: async (
    agentName: AgentName,
  ): Promise<InstructionBlob> => {
    if (isLive()) {
      const res = await fetch(
        `/api/agent/instructions?agent=${encodeURIComponent(agentName)}`,
        { signal: AbortSignal.timeout(LIVE_TIMEOUT_MS) },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { instructions?: unknown };
      if (typeof data.instructions !== 'string') {
        throw new Error('Malformed instructions response');
      }
      return data.instructions;
    }

    await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
    return mockInstructionsStore[agentName];
  },

  /**
   * Persist the instruction blob for an agent.
   * Live: PUT /api/agent/instructions — the server backs up the current
   * object BEFORE writing (I3); non-OK throws and the block shows the Alert.
   * Mock: mutates the in-memory store. Reloads wipe state.
   */
  updateInstructions: async (
    agentName: AgentName,
    content: InstructionBlob,
  ): Promise<void> => {
    if (isLive()) {
      const res = await fetch('/api/agent/instructions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_name: agentName, content }),
        signal: AbortSignal.timeout(LIVE_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return;
    }

    await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
    mockInstructionsStore[agentName] = content;
  },
};

/**
 * BACKEND_SWAP_NOTES (refreshed by BIM-005 — the swap this block described
 * has happened; the wrapper-era F7 question is settled: direct GCS via
 * internal API routes with ADC, per ruling I1)
 *
 * Method             | Live path                                   | Notes
 * -------------------|---------------------------------------------|------------------------------------------
 * fetchInstructions  | GET /api/agent/instructions?agent={name}    | Server reads gs://{GCS_BUCKET}/{GCS_BASE_FOLDER}/{agent}/{agent}_instructions.txt
 * updateInstructions | PUT /api/agent/instructions                 | Server copies current → versions/…{ISO}.bak FIRST, then writes (I3 — no save without backup)
 *
 * Error surface: non-OK → throw; AgentInstructionBlock renders fetch failures
 * per DATA_CONTRACT §1.11 and save failures via its Alert. Concurrency is
 * last-write-wins (I8, documented). No delete capability exists.
 */
