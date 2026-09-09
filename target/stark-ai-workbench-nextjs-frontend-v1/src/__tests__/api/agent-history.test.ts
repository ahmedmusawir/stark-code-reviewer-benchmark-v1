/**
 * Unit tests for POST /api/agent/history (BIM-002 native connector).
 * Intent (Rule K9): the route GETs the native session and returns the
 * normalized `{ history }` — the EXTERNAL contract is frozen (service still
 * unwraps `.history`); 500 config fault, 502 upstream fault, Authorization
 * pass-through (R2). BIM-001's proxy-protocol assertions replaced per FLAG-2.
 */

import { POST } from '@/app/api/agent/history/route';

import {
  historyEmptySession,
  historySession,
  historySessionExpected,
} from './fixtures/adk-events';

const BUNDLE = 'https://bundle.example.test';

const fetchMock = jest.fn();

function makeRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
) {
  return new Request('http://localhost/api/agent/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

const HISTORY_BODY = {
  agent_name: 'jarvis_agent',
  user_id: 'u-1',
  session_id: 'session-42',
};

describe('POST /api/agent/history', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.ADK_BUNDLE_URL_V1;

  beforeEach(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
    process.env.ADK_BUNDLE_URL_V1 = BUNDLE;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    if (originalEnv === undefined) delete process.env.ADK_BUNDLE_URL_V1;
    else process.env.ADK_BUNDLE_URL_V1 = originalEnv;
  });

  it('GETs the native session path with a timeout signal', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(historySession), { status: 200 }),
    );

    await POST(makeRequest(HISTORY_BODY));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `${BUNDLE}/apps/jarvis_agent/users/u-1/sessions/session-42`,
    );
    expect(init.method).toBe('GET');
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('normalizes session events to { history: Message[] } (roles mapped, non-text skipped)', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(historySession), { status: 200 }),
    );

    const res = await POST(makeRequest(HISTORY_BODY));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      history: historySessionExpected,
    });
  });

  it('returns { history: [] } for a valid session with empty events (the N7 shape)', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(historyEmptySession), { status: 200 }),
    );

    const res = await POST(makeRequest(HISTORY_BODY));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ history: [] });
  });

  it('passes through the Authorization header when present (R2)', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(historyEmptySession), { status: 200 }),
    );

    await POST(makeRequest(HISTORY_BODY, { Authorization: 'Bearer tok-123' }));

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer tok-123');
  });

  it('returns 502 { error } when the upstream responds non-OK', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{"detail":"Session not found"}', { status: 404 }),
    );

    const res = await POST(makeRequest(HISTORY_BODY));

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({
      error: 'History fetch failed: 404',
    });
  });

  it('returns 502 { error } when the bundle is unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('fetch failed'));

    const res = await POST(makeRequest(HISTORY_BODY));

    expect(res.status).toBe(502);
    const json = await res.json();
    expect(typeof json.error).toBe('string');
  });

  it('returns 500 { error } and makes zero HTTP calls when ADK_BUNDLE_URL_V1 is unset', async () => {
    delete process.env.ADK_BUNDLE_URL_V1;

    const res = await POST(makeRequest(HISTORY_BODY));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: 'ADK_BUNDLE_URL_V1 is not configured',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 400 { error } and zero HTTP calls for an agent not in the manifest (M-G4)', async () => {
    const res = await POST(
      makeRequest({ ...HISTORY_BODY, agent_name: 'ghost_agent' }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: 'Unknown agent: ghost_agent',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
