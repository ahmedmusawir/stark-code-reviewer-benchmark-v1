/**
 * Unit tests for the native ADK connector lib (BIM-002).
 * Intent (Rule K9): the ported jewels behave byte-equivalently to the wrapper
 * oracle — response selection (reversed scan), history normalization, the
 * not-found→create→retry-ONCE loop, and session-id bootstrap — against
 * realistic fixtures in both author styles (FLAG-1 ruling).
 */

import {
  ConnectorError,
  extractResponseText,
  isSessionNotFound,
  newSessionId,
  normalizeHistory,
  runAgentFlow,
  sessionUrl,
} from '@/app/api/agent/_lib/adk';
import type { RunAgentRequest } from '@/types';

import {
  authorModelStyleEvents,
  authorModelStyleExpected,
  emptyEvents,
  happyPathEvents,
  happyPathExpected,
  historyEmptySession,
  historySession,
  historySessionExpected,
  malformedEvents,
  multiEventExpected,
  multiEventRun,
  sessionNotFound404,
} from './fixtures/adk-events';

const BUNDLE = 'https://bundle.example.test';

describe('extractResponseText (R5 response selection)', () => {
  it('selects the model text from a happy-path run (canonical author style)', () => {
    expect(extractResponseText(happyPathEvents)).toBe(happyPathExpected);
  });

  it('reversed scan selects the LAST model text in a multi-event run', () => {
    expect(extractResponseText(multiEventRun)).toBe(multiEventExpected);
  });

  it('parses the author:"model" style identically (FLAG-1 dual-style)', () => {
    expect(extractResponseText(authorModelStyleEvents)).toBe(
      authorModelStyleExpected,
    );
  });

  it('returns null for an empty event array', () => {
    expect(extractResponseText(emptyEvents)).toBeNull();
  });

  it('returns null for malformed events without crashing', () => {
    expect(extractResponseText(malformedEvents)).toBeNull();
  });

  it('returns null for non-array input', () => {
    expect(extractResponseText({ detail: 'oops' })).toBeNull();
    expect(extractResponseText(null)).toBeNull();
  });
});

describe('normalizeHistory (A2.3 §4)', () => {
  it('maps mixed turns to Message[], skipping non-text events, order preserved', () => {
    expect(normalizeHistory(historySession)).toEqual(historySessionExpected);
  });

  it('normalizes an empty-events session to [] (the N7 shape)', () => {
    expect(normalizeHistory(historyEmptySession)).toEqual([]);
  });

  it('degrades to [] for malformed sessions, never crashes', () => {
    expect(normalizeHistory(null)).toEqual([]);
    expect(normalizeHistory({})).toEqual([]);
    expect(normalizeHistory({ events: 'nope' })).toEqual([]);
    expect(normalizeHistory({ events: malformedEvents })).toEqual([]);
  });
});

describe('isSessionNotFound', () => {
  it('matches 404 status', () => {
    expect(isSessionNotFound(404, '')).toBe(true);
  });

  it('matches the detail text regardless of status', () => {
    expect(
      isSessionNotFound(500, JSON.stringify(sessionNotFound404)),
    ).toBe(true);
  });

  it('does not match other failures', () => {
    expect(isSessionNotFound(500, '{"detail":"boom"}')).toBe(false);
    expect(isSessionNotFound(422, 'validation error')).toBe(false);
  });
});

describe('newSessionId (R4)', () => {
  it("preserves the wrapper's session-${Date.now()} convention", () => {
    expect(newSessionId()).toMatch(/^session-\d+$/);
  });
});

describe('sessionUrl', () => {
  it('builds the native path with encoded segments', () => {
    expect(sessionUrl(BUNDLE, 'jarvis_agent', 'u/1', 'session-1')).toBe(
      `${BUNDLE}/apps/jarvis_agent/users/u%2F1/sessions/session-1`,
    );
  });
});

describe('runAgentFlow (session bootstrap + retry-once)', () => {
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;
  const ctx = { baseUrl: BUNDLE, auth: null };

  const REQ: RunAgentRequest = {
    agent_name: 'jarvis_agent',
    message: 'status report',
    user_id: 'u-1',
    session_id: 'session-42',
  };

  beforeEach(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  const okRun = () =>
    new Response(JSON.stringify(happyPathEvents), { status: 200 });
  const okCreate = () => new Response('{}', { status: 200 });
  const notFound = () =>
    new Response(JSON.stringify(sessionNotFound404), { status: 404 });

  it('existing session: exactly one /run call, correct native payload', async () => {
    fetchMock.mockResolvedValueOnce(okRun());

    const result = await runAgentFlow(ctx, REQ);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BUNDLE}/run`);
    expect(JSON.parse(init.body)).toEqual({
      app_name: 'jarvis_agent',
      user_id: 'u-1',
      session_id: 'session-42',
      new_message: { role: 'user', parts: [{ text: 'status report' }] },
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(result).toEqual({
      response: happyPathExpected,
      session_id: 'session-42',
    });
  });

  it('null session (N5): generates session-${Date.now()}, creates, then runs', async () => {
    fetchMock.mockResolvedValueOnce(okCreate()).mockResolvedValueOnce(okRun());

    const result = await runAgentFlow(ctx, { ...REQ, session_id: null });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [createUrl, createInit] = fetchMock.mock.calls[0];
    expect(createUrl).toMatch(
      new RegExp(`^${BUNDLE}/apps/jarvis_agent/users/u-1/sessions/session-\\d+$`),
    );
    expect(createInit.method).toBe('POST');
    expect(createInit.body).toBe('{}');
    const [runUrl] = fetchMock.mock.calls[1];
    expect(runUrl).toBe(`${BUNDLE}/run`);
    expect(result.session_id).toMatch(/^session-\d+$/);
    expect(result.response).toBe(happyPathExpected);
  });

  it('session-not-found (N6): exactly one create + one retry, then success', async () => {
    fetchMock
      .mockResolvedValueOnce(notFound()) // run #1 → 404
      .mockResolvedValueOnce(okCreate()) // create
      .mockResolvedValueOnce(okRun()); // run #2 → 200

    const result = await runAgentFlow(ctx, REQ);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][0]).toBe(`${BUNDLE}/run`);
    expect(fetchMock.mock.calls[1][0]).toBe(
      `${BUNDLE}/apps/jarvis_agent/users/u-1/sessions/session-42`,
    );
    expect(fetchMock.mock.calls[2][0]).toBe(`${BUNDLE}/run`);
    expect(result).toEqual({
      response: happyPathExpected,
      session_id: 'session-42',
    });
  });

  it('retry failure (N6): second run failure → ConnectorError 502, no third run', async () => {
    fetchMock
      .mockResolvedValueOnce(notFound())
      .mockResolvedValueOnce(okCreate())
      .mockResolvedValueOnce(
        new Response('{"detail":"boom"}', { status: 500 }),
      );

    await expect(runAgentFlow(ctx, REQ)).rejects.toMatchObject({
      status: 502,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('non-not-found run failure → 502 with NO retry', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{"detail":"internal"}', { status: 500 }),
    );

    await expect(runAgentFlow(ctx, REQ)).rejects.toBeInstanceOf(ConnectorError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('run succeeds but no model text in events → 502 "No model response in events"', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(emptyEvents), { status: 200 }),
    );

    await expect(runAgentFlow(ctx, REQ)).rejects.toMatchObject({
      status: 502,
      message: 'No model response in events',
    });
  });

  it('forwards the Authorization header on create AND run (R2)', async () => {
    fetchMock.mockResolvedValueOnce(okCreate()).mockResolvedValueOnce(okRun());

    await runAgentFlow(
      { baseUrl: BUNDLE, auth: 'Bearer tok-123' },
      { ...REQ, session_id: null },
    );

    for (const [, init] of fetchMock.mock.calls) {
      expect(init.headers.Authorization).toBe('Bearer tok-123');
    }
  });
});
