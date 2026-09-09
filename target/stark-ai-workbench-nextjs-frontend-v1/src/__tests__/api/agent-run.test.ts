/**
 * Unit tests for POST /api/agent/run (BIM-002 native connector).
 * Intent (Rule K9): the route speaks native ADK api_server protocol while the
 * EXTERNAL contract stays frozen — `{response, session_id}` out, 500 config
 * fault, 502 upstream fault, Authorization pass-through (R2). Overlapping
 * guarantees from the BIM-001 suite are preserved; the retired proxy protocol
 * assertions are replaced per the FLAG-2 ruling.
 */

import { POST } from '@/app/api/agent/run/route';

import {
  happyPathEvents,
  happyPathExpected,
  sessionNotFound404,
} from './fixtures/adk-events';

const BUNDLE = 'https://bundle.example.test';

const fetchMock = jest.fn();

function makeRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
) {
  return new Request('http://localhost/api/agent/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

const RUN_BODY = {
  agent_name: 'jarvis_agent',
  message: 'hello',
  user_id: 'u-1',
  session_id: 'session-42',
};

const okRun = () =>
  new Response(JSON.stringify(happyPathEvents), { status: 200 });
const okCreate = () => new Response('{}', { status: 200 });

describe('POST /api/agent/run', () => {
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

  it('existing session: single native /run call with the ADK payload and a timeout signal', async () => {
    fetchMock.mockResolvedValueOnce(okRun());

    const res = await POST(makeRequest(RUN_BODY));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BUNDLE}/run`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      app_name: 'jarvis_agent',
      user_id: 'u-1',
      session_id: 'session-42',
      new_message: { role: 'user', parts: [{ text: 'hello' }] },
    });
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      response: happyPathExpected,
      session_id: 'session-42',
    });
  });

  it('null session (N5): creates session-${Date.now()} then runs; returns the generated id', async () => {
    fetchMock.mockResolvedValueOnce(okCreate()).mockResolvedValueOnce(okRun());

    const res = await POST(makeRequest({ ...RUN_BODY, session_id: null }));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toMatch(
      new RegExp(`^${BUNDLE}/apps/jarvis_agent/users/u-1/sessions/session-\\d+$`),
    );
    expect(fetchMock.mock.calls[1][0]).toBe(`${BUNDLE}/run`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.response).toBe(happyPathExpected);
    expect(json.session_id).toMatch(/^session-\d+$/);
  });

  it('session-not-found (N6): create + retry exactly once, then success', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify(sessionNotFound404), { status: 404 }),
      )
      .mockResolvedValueOnce(okCreate())
      .mockResolvedValueOnce(okRun());

    const res = await POST(makeRequest(RUN_BODY));

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      response: happyPathExpected,
      session_id: 'session-42',
    });
  });

  it('retry failure (N6): second run failure → 502 { error }', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify(sessionNotFound404), { status: 404 }),
      )
      .mockResolvedValueOnce(okCreate())
      .mockResolvedValueOnce(new Response('{"detail":"boom"}', { status: 500 }));

    const res = await POST(makeRequest(RUN_BODY));

    expect(res.status).toBe(502);
    const json = await res.json();
    expect(typeof json.error).toBe('string');
  });

  it('run succeeds with no model text → 502 "No model response in events"', async () => {
    fetchMock.mockResolvedValueOnce(new Response('[]', { status: 200 }));

    const res = await POST(makeRequest(RUN_BODY));

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({
      error: 'No model response in events',
    });
  });

  it('passes through the Authorization header when present (R2)', async () => {
    fetchMock.mockResolvedValueOnce(okRun());

    await POST(makeRequest(RUN_BODY, { Authorization: 'Bearer tok-123' }));

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer tok-123');
  });

  it('omits the Authorization header when absent', async () => {
    fetchMock.mockResolvedValueOnce(okRun());

    await POST(makeRequest(RUN_BODY));

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).not.toHaveProperty('Authorization');
  });

  it('returns 502 { error } when the bundle is unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('connect ECONNREFUSED'));

    const res = await POST(makeRequest(RUN_BODY));

    expect(res.status).toBe(502);
    const json = await res.json();
    expect(typeof json.error).toBe('string');
    expect(json.error).toContain('ECONNREFUSED');
  });

  it('returns 500 { error } and makes zero HTTP calls when ADK_BUNDLE_URL_V1 is unset', async () => {
    delete process.env.ADK_BUNDLE_URL_V1;

    const res = await POST(makeRequest(RUN_BODY));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: 'ADK_BUNDLE_URL_V1 is not configured',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 400 { error } and zero HTTP calls for an agent not in the manifest (M-G4)', async () => {
    const res = await POST(
      makeRequest({ ...RUN_BODY, agent_name: 'ghost_agent' }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: 'Unknown agent: ghost_agent',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
