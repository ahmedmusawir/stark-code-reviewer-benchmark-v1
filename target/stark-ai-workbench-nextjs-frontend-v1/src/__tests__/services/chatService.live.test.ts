/**
 * chatService live-mode tests (BIM-001). Wrapper mocked at the fetch level —
 * no real HTTP leaves these tests.
 *
 * Intent (Rule K9), mapped to gates:
 *   G3 — flag unset/garbage → mock path, ZERO fetch calls (fail-safe default)
 *   G7 — falsy session_id → [] with ZERO fetch calls
 *   G8 — failure → D1(b) sentinel: error string in `response`, request's
 *        session_id ?? '' echoed; getHistory failure → [] and never throws
 */

import { chatService } from '@/services';
import type { GetHistoryRequest, RunAgentRequest } from '@/types';

const fetchMock = jest.fn();

const RUN_INPUT: RunAgentRequest = {
  agent_name: 'jarvis_agent',
  message: 'hello',
  user_id: 'u-1',
  session_id: 'sess-existing',
};

const HISTORY_INPUT: GetHistoryRequest = {
  agent_name: 'jarvis_agent',
  user_id: 'u-1',
  session_id: 'sess-existing',
};

function okJson(payload: unknown) {
  return { ok: true, status: 200, json: async () => payload };
}

describe('chatService live mode', () => {
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

  describe('mode flag (G3 — fail-safe default)', () => {
    it('unset flag → mock path, zero fetch calls', async () => {
      delete process.env.NEXT_PUBLIC_CHAT_MODE;

      const result = await chatService.sendMessage(RUN_INPUT);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(typeof result.response).toBe('string');
      expect(typeof result.session_id).toBe('string');
    });

    it('unrecognized flag value → mock path, zero fetch calls', async () => {
      process.env.NEXT_PUBLIC_CHAT_MODE = 'banana';

      const result = await chatService.getHistory(HISTORY_INPUT);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('sendMessage', () => {
    it('POSTs the request to /api/agent/run and returns the wrapper response', async () => {
      fetchMock.mockResolvedValue(
        okJson({ response: 'hi from ADK', session_id: 'sess-new' }),
      );

      const result = await chatService.sendMessage(RUN_INPUT);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/agent/run');
      expect(init.method).toBe('POST');
      expect(init.body).toBe(JSON.stringify(RUN_INPUT));
      expect(init.signal).toBeInstanceOf(AbortSignal);
      expect(result).toEqual({
        response: 'hi from ADK',
        session_id: 'sess-new',
      });
    });

    it('defaults `response` to "Error: No response content." when missing from body', async () => {
      fetchMock.mockResolvedValue(okJson({ session_id: 'sess-new' }));

      const result = await chatService.sendMessage(RUN_INPUT);

      expect(result.response).toBe('Error: No response content.');
      expect(result.session_id).toBe('sess-new');
    });

    it('G8: fetch rejection → resolves with sentinel echoing the request session_id', async () => {
      fetchMock.mockRejectedValue(new Error('network down'));

      const result = await chatService.sendMessage(RUN_INPUT);

      expect(result.response).toMatch(
        /^Error: Could not reach Agent Service\. Details: /,
      );
      expect(result.response).toContain('network down');
      expect(result.session_id).toBe('sess-existing');
    });

    it('G8 (D1b): sentinel session_id is "" when the request had session_id null', async () => {
      fetchMock.mockRejectedValue(new Error('network down'));

      const result = await chatService.sendMessage({
        ...RUN_INPUT,
        session_id: null,
      });

      expect(result.session_id).toBe('');
    });

    it('G8: non-ok HTTP status (route 502) → sentinel, not a throw', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({ error: 'upstream unreachable' }),
      });

      const result = await chatService.sendMessage(RUN_INPUT);

      expect(result.response).toContain(
        'Error: Could not reach Agent Service.',
      );
      expect(result.response).toContain('HTTP 502');
      expect(result.session_id).toBe('sess-existing');
    });
  });

  describe('getHistory', () => {
    it('G7: falsy session_id → [] with zero HTTP calls', async () => {
      const result = await chatService.getHistory({
        ...HISTORY_INPUT,
        session_id: '',
      });

      expect(result).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('POSTs to /api/agent/history and unwraps .history', async () => {
      const history = [
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: 'hello there' },
      ];
      fetchMock.mockResolvedValue(okJson({ history }));

      const result = await chatService.getHistory(HISTORY_INPUT);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/agent/history');
      expect(init.body).toBe(JSON.stringify(HISTORY_INPUT));
      expect(init.signal).toBeInstanceOf(AbortSignal);
      expect(result).toEqual(history);
    });

    it('failure → console.error + [] (history never blocks chat)', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      fetchMock.mockRejectedValue(new Error('network down'));

      const result = await chatService.getHistory(HISTORY_INPUT);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('non-ok HTTP status → [] rather than a throw', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      fetchMock.mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({ error: 'upstream unreachable' }),
      });

      const result = await chatService.getHistory(HISTORY_INPUT);

      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });
  });
});
