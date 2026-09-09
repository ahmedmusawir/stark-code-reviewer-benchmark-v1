/**
 * Native ADK connector — the wrapper's brains, ported home (BIM-002).
 *
 * Talks directly to the ADK bundle's `api_server` API. Ports the wrapper's
 * three jewels: session creation, the not-found→create→retry-once loop, and
 * event-array response parsing. Pure parsing/normalizing functions are
 * fixture-testable without HTTP.
 *
 * Model-authored predicate (Architect FLAG-1 ruling): an event is a model
 * response iff `content.role === "model"` with a text part — real ADK events
 * carry `author: "<agent_name>"`, so author is never used for detection.
 *
 * @see agent_docs/CURRENT_APP/BIM002/DATA_CONTRACT_AMENDMENT_A2.md
 */

import type { Message, RunAgentRequest, RunAgentResponse } from '@/types';

// Run path shares one 90s deadline across create + run + retry (A2.3 §5);
// per-call caps keep a hung create from eating the whole budget.
const RUN_TOTAL_MS = 90_000;
const RUN_CALL_CAP_MS = 75_000;
const CREATE_CALL_CAP_MS = 10_000;

interface AdkPart {
  text?: unknown;
}

interface AdkContent {
  role?: unknown;
  parts?: unknown;
}

interface AdkEvent {
  author?: unknown;
  content?: AdkContent;
}

interface AdkSession {
  events?: unknown;
}

/** Upstream/config fault carrying the HTTP status the route should return. */
export class ConnectorError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** R4: preserve the wrapper's session-id convention this module. */
export const newSessionId = (): string => `session-${Date.now()}`;

/** The wrapper's session-not-found signature: 404 or the detail text. */
export function isSessionNotFound(status: number, bodyText: string): boolean {
  return status === 404 || /session not found/i.test(bodyText);
}

/**
 * Reversed scan of a run's event array for the LAST model-authored text part
 * (wrapper-equivalent response selection). Returns null when no event
 * qualifies — callers surface that as a 502, never a crash.
 */
export function extractResponseText(events: unknown): string | null {
  if (!Array.isArray(events)) return null;
  for (let i = events.length - 1; i >= 0; i--) {
    const text = firstTextPart(events[i] as AdkEvent, 'model');
    if (text !== null) return text;
  }
  return null;
}

/**
 * Session events → the contract's `Message[]` (A2.3 §4): role "model" →
 * assistant, "user" → user; text parts only; everything else skipped.
 * Order preserved oldest→newest. Malformed input degrades to [].
 */
export function normalizeHistory(session: unknown): Message[] {
  const events = (session as AdkSession | null)?.events;
  if (!Array.isArray(events)) return [];
  const history: Message[] = [];
  for (const raw of events) {
    const event = raw as AdkEvent;
    const role = event?.content?.role;
    if (role !== 'user' && role !== 'model') continue;
    const text = firstTextPart(event, role);
    if (text === null) continue;
    history.push({
      role: role === 'model' ? 'assistant' : 'user',
      content: text,
    });
  }
  return history;
}

function firstTextPart(event: AdkEvent, role: 'user' | 'model'): string | null {
  if (event?.content?.role !== role) return null;
  const parts = event.content.parts;
  if (!Array.isArray(parts)) return null;
  for (const part of parts) {
    const text = (part as AdkPart)?.text;
    if (typeof text === 'string' && text.length > 0) return text;
  }
  return null;
}

export interface ConnectorContext {
  baseUrl: string;
  /** R2: reserved auth slot — forwarded verbatim on every native call. */
  auth: string | null;
}

function callHeaders(auth: string | null): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(auth ? { Authorization: auth } : {}),
  };
}

const remainingMs = (deadline: number, cap: number): number =>
  Math.max(1, Math.min(cap, deadline - Date.now()));

export function sessionUrl(
  baseUrl: string,
  agentName: string,
  userId: string,
  sessionId: string,
): string {
  return `${baseUrl}/apps/${encodeURIComponent(agentName)}/users/${encodeURIComponent(
    userId,
  )}/sessions/${encodeURIComponent(sessionId)}`;
}

async function createSession(
  ctx: ConnectorContext,
  agentName: string,
  userId: string,
  sessionId: string,
  deadline: number,
): Promise<void> {
  const res = await fetch(sessionUrl(ctx.baseUrl, agentName, userId, sessionId), {
    method: 'POST',
    headers: callHeaders(ctx.auth),
    body: '{}',
    signal: AbortSignal.timeout(remainingMs(deadline, CREATE_CALL_CAP_MS)),
  });
  if (!res.ok) {
    throw new ConnectorError(
      502,
      `Create session failed: ${res.status} ${await res.text()}`,
    );
  }
}

async function runOnce(
  ctx: ConnectorContext,
  input: { agentName: string; userId: string; sessionId: string; message: string },
  deadline: number,
): Promise<Response> {
  return fetch(`${ctx.baseUrl}/run`, {
    method: 'POST',
    headers: callHeaders(ctx.auth),
    body: JSON.stringify({
      app_name: input.agentName,
      user_id: input.userId,
      session_id: input.sessionId,
      new_message: { role: 'user', parts: [{ text: input.message }] },
    }),
    signal: AbortSignal.timeout(remainingMs(deadline, RUN_CALL_CAP_MS)),
  });
}

/**
 * The full run flow (A2.3 §1–3): bootstrap session when the request carries
 * none; run; on the session-not-found signature create + retry EXACTLY once;
 * reversed-scan the events for the response text. Throws ConnectorError for
 * upstream faults; network-level rejections propagate for the route's catch.
 */
export async function runAgentFlow(
  ctx: ConnectorContext,
  request: RunAgentRequest,
): Promise<RunAgentResponse> {
  const deadline = Date.now() + RUN_TOTAL_MS;
  const { agent_name: agentName, user_id: userId, message } = request;

  let sessionId = request.session_id;
  if (!sessionId) {
    sessionId = newSessionId();
    await createSession(ctx, agentName, userId, sessionId, deadline);
  }

  const runInput = { agentName, userId, sessionId, message };
  let res = await runOnce(ctx, runInput, deadline);

  if (!res.ok) {
    const bodyText = await res.text();
    if (!isSessionNotFound(res.status, bodyText)) {
      throw new ConnectorError(502, `Run failed: ${res.status} ${bodyText}`);
    }
    // The ported retry-once loop: create, retry, never loop again.
    await createSession(ctx, agentName, userId, sessionId, deadline);
    res = await runOnce(ctx, runInput, deadline);
    if (!res.ok) {
      throw new ConnectorError(
        502,
        `Run failed after session create: ${res.status} ${await res.text()}`,
      );
    }
  }

  const events: unknown = await res.json();
  const responseText = extractResponseText(events);
  if (responseText === null) {
    throw new ConnectorError(502, 'No model response in events');
  }
  return { response: responseText, session_id: sessionId };
}
