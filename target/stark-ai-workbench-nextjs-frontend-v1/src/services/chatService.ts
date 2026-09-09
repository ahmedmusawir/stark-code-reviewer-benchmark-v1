/**
 * chatService — mode-flagged (BIM-001).
 *
 * `NEXT_PUBLIC_CHAT_MODE=live` routes chat through the internal /api/agent/*
 * handlers to the ADK bundle (native, BIM-002). Any other value (or unset) keeps the
 * Phase-3 mock path — the app must never accidentally ship live-wired.
 * Method signatures unchanged from the FFM contract.
 *
 * @see _project/DATA_CONTRACT.md §2.2
 * @see agent_docs/CURRENT_APP/BIM001/DATA_CONTRACT_AMENDMENT.md §A1.3–§A1.4
 */

import { mockMessagesBySession } from '@/mocks/data/messages';
import { generateMockResponse } from '@/mocks/responses';
import type {
  GetHistoryRequest,
  GetHistoryResponse,
  Message,
  RunAgentRequest,
  RunAgentResponse,
} from '@/types';

const SEND_DELAY_MS = 1000; // visibility for "Agent is thinking..." in Phase 5
const HISTORY_DELAY_MS = 200;

const SEND_TIMEOUT_MS = 90_000;
const HISTORY_TIMEOUT_MS = 30_000;

// Read at call time; Next.js inlines NEXT_PUBLIC_* statically in the client
// bundle either way, and Jest can flip the flag per-test.
const isLive = () => process.env.NEXT_PUBLIC_CHAT_MODE === 'live';

export const chatService = {
  /**
   * Send a chat message to the configured agent.
   * Live: POST /api/agent/run. On failure resolves (never throws) with the
   * D1(b) sentinel — error string in `response`, request's session_id echoed.
   * Mock: deterministic agent-voiced response via generateMockResponse.
   */
  sendMessage: async (input: RunAgentRequest): Promise<RunAgentResponse> => {
    if (isLive()) {
      try {
        const res = await fetch('/api/agent/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
          signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Partial<RunAgentResponse>;
        return {
          response: data.response ?? 'Error: No response content.',
          session_id: data.session_id ?? input.session_id ?? '',
        };
      } catch (e) {
        return {
          response: `Error: Could not reach Agent Service. Details: ${e}`,
          session_id: input.session_id ?? '',
        };
      }
    }

    await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
    return generateMockResponse(
      input.agent_name,
      input.message,
      input.session_id,
    );
  },

  /**
   * Fetch conversation history for a given agent + session.
   * Live: guard first — falsy session_id → [] with zero HTTP. Else POST
   * /api/agent/history and unwrap `.history`; any failure → [] (history
   * fetch failure must never block chat).
   * Mock: returns the seeded conversation for known session_ids; [] otherwise.
   */
  getHistory: async (input: GetHistoryRequest): Promise<Message[]> => {
    if (isLive()) {
      if (!input.session_id) return [];
      try {
        const res = await fetch('/api/agent/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
          signal: AbortSignal.timeout(HISTORY_TIMEOUT_MS),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Partial<GetHistoryResponse>;
        return data.history ?? [];
      } catch (e) {
        console.error('chatService.getHistory failed:', e);
        return [];
      }
    }

    await new Promise((r) => setTimeout(r, HISTORY_DELAY_MS));
    return mockMessagesBySession[input.session_id] ?? [];
  },
};

/**
 * BACKEND_SWAP_NOTES (amended by BIM-001 §A1.1; wording refreshed FIX-002c —
 * the wrapper is retired, routes speak native ADK per BIM-002 §A2)
 *
 * The seam: service methods call internal Next.js route handlers, which talk
 * server-side to the ADK bundle's api_server directly. This service and every
 * component above it stay put across backend swaps.
 *
 * Method       | Endpoint                    | Timeout | Notes
 * -------------|-----------------------------|---------|---------------------------------
 * sendMessage  | POST /api/agent/run         | 90s     | Bare catch → sentinel response with error string in `response` field
 * getHistory   | POST /api/agent/history     | 30s     | Client-side guard: if session_id falsy, no HTTP call, return []
 *
 * Error handling per DATA_CONTRACT §1.5 + D1 ruling (2026-07-16, option b):
 *   On client-side HTTP error, sendMessage resolves with:
 *     { response: "Error: Could not reach Agent Service. Details: <e>",
 *       session_id: <request's session_id ?? ''> }
 *   `response` defaults to "Error: No response content." if missing from response body.
 *   getHistory failure → console.error + [] — never blocks chat.
 *
 * Wire format: snake_case fields preserved (matches FastAPI/Pydantic convention).
 */
