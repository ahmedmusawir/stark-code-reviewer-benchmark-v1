/**
 * Live-mode tests for instructionsService (BIM-005, I6).
 * Intent (Rule K9): the live branch speaks the route contract (GET query /
 * PUT body), throws on non-OK so Mission Control's existing failure UI fires,
 * and the mock path stays byte-identical when the flag is off.
 */

import { instructionsService } from '@/services/instructionsService';

const fetchMock = jest.fn();

describe('instructionsService (live mode)', () => {
  const originalFetch = global.fetch;
  const originalMode = process.env.NEXT_PUBLIC_CHAT_MODE;

  beforeEach(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
    process.env.NEXT_PUBLIC_CHAT_MODE = 'live';
  });

  afterAll(() => {
    global.fetch = originalFetch;
    if (originalMode === undefined) delete process.env.NEXT_PUBLIC_CHAT_MODE;
    else process.env.NEXT_PUBLIC_CHAT_MODE = originalMode;
  });

  it('fetchInstructions GETs the route with the agent query and a timeout signal', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ instructions: 'You are Jarvis.' }), {
        status: 200,
      }),
    );

    const result = await instructionsService.fetchInstructions('jarvis_agent');

    expect(result).toBe('You are Jarvis.');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/agent/instructions?agent=jarvis_agent');
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('fetchInstructions throws on non-OK (Mission Control renders the failure)', async () => {
    fetchMock.mockResolvedValue(new Response('{"error":"boom"}', { status: 502 }));

    await expect(
      instructionsService.fetchInstructions('jarvis_agent'),
    ).rejects.toThrow('HTTP 502');
  });

  it('fetchInstructions throws on a malformed body', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));

    await expect(
      instructionsService.fetchInstructions('jarvis_agent'),
    ).rejects.toThrow('Malformed instructions response');
  });

  it('updateInstructions PUTs {agent_name, content} to the route', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true, backup: 'x.bak' }), { status: 200 }),
    );

    await instructionsService.updateInstructions('jarvis_agent', 'New text');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/agent/instructions');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({
      agent_name: 'jarvis_agent',
      content: 'New text',
    });
  });

  it('updateInstructions throws on non-OK (block shows the Alert)', async () => {
    fetchMock.mockResolvedValue(new Response('{"error":"nope"}', { status: 502 }));

    await expect(
      instructionsService.updateInstructions('jarvis_agent', 'x'),
    ).rejects.toThrow('HTTP 502');
  });

  it('mock mode (flag off) never touches fetch and serves the seeded store', async () => {
    process.env.NEXT_PUBLIC_CHAT_MODE = 'mock';

    const blob = await instructionsService.fetchInstructions('jarvis_agent');

    expect(typeof blob).toBe('string');
    expect(blob.length).toBeGreaterThan(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
