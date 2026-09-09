/**
 * Unit tests for /api/agent/instructions (BIM-005).
 * Intent (Rule K9): the error surface (400 unknown agent / 500 naming the
 * env var / 502 GCS fault) and THE BACKUP LAW — backup happens BEFORE the
 * write, a failed backup means ZERO writes, and only a clean not-found
 * skips the backup. GCS fully mocked.
 */

const copyMock = jest.fn();
const saveMock = jest.fn();
const downloadMock = jest.fn();
const fileMock = jest.fn(() => ({
  copy: copyMock,
  save: saveMock,
  download: downloadMock,
}));
const bucketMock = jest.fn(() => ({ file: fileMock }));

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn(() => ({ bucket: bucketMock })),
}));

import { GET, PUT } from '@/app/api/agent/instructions/route';

const BUCKET = 'test-bucket';
const BASE = 'agent-instructions';

function getRequest(agent: string | null) {
  const url = new URL('http://localhost/api/agent/instructions');
  if (agent !== null) url.searchParams.set('agent', agent);
  return new Request(url);
}

function putRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/agent/instructions', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const notFoundError = () => Object.assign(new Error('No such object'), { code: 404 });

describe('/api/agent/instructions', () => {
  const originalBucket = process.env.GCS_BUCKET;
  const originalBase = process.env.GCS_BASE_FOLDER;

  beforeEach(() => {
    copyMock.mockReset().mockResolvedValue(undefined);
    saveMock.mockReset().mockResolvedValue(undefined);
    downloadMock.mockReset();
    fileMock.mockClear();
    process.env.GCS_BUCKET = BUCKET;
    process.env.GCS_BASE_FOLDER = BASE;
  });

  afterAll(() => {
    if (originalBucket === undefined) delete process.env.GCS_BUCKET;
    else process.env.GCS_BUCKET = originalBucket;
    if (originalBase === undefined) delete process.env.GCS_BASE_FOLDER;
    else process.env.GCS_BASE_FOLDER = originalBase;
  });

  describe('GET', () => {
    it('returns the instructions text from the derived path', async () => {
      downloadMock.mockResolvedValue([Buffer.from('You are Jarvis.')]);

      const res = await GET(getRequest('jarvis_agent'));

      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({
        instructions: 'You are Jarvis.',
      });
      expect(fileMock).toHaveBeenCalledWith(
        `${BASE}/jarvis_agent/jarvis_agent_instructions.txt`,
      );
    });

    it('400 for an agent not in the manifest — zero GCS calls', async () => {
      const res = await GET(getRequest('ghost_agent'));
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({
        error: 'Unknown agent: ghost_agent',
      });
      expect(downloadMock).not.toHaveBeenCalled();
    });

    it('400 when agent param is missing', async () => {
      const res = await GET(getRequest(null));
      expect(res.status).toBe(400);
    });

    it('500 naming GCS_BUCKET when unset', async () => {
      delete process.env.GCS_BUCKET;
      const res = await GET(getRequest('jarvis_agent'));
      expect(res.status).toBe(500);
      await expect(res.json()).resolves.toEqual({
        error: 'GCS_BUCKET is not configured',
      });
    });

    it('500 naming GCS_BASE_FOLDER when unset', async () => {
      delete process.env.GCS_BASE_FOLDER;
      const res = await GET(getRequest('jarvis_agent'));
      expect(res.status).toBe(500);
      await expect(res.json()).resolves.toEqual({
        error: 'GCS_BASE_FOLDER is not configured',
      });
    });

    it('502 on GCS failure', async () => {
      downloadMock.mockRejectedValue(new Error('gcs exploded'));
      const res = await GET(getRequest('jarvis_agent'));
      expect(res.status).toBe(502);
      const json = await res.json();
      expect(json.error).toContain('gcs exploded');
    });
  });

  describe('PUT — the backup law (C-G3)', () => {
    const BODY = { agent_name: 'jarvis_agent', content: 'You are MORE Jarvis.' };

    it('backs up BEFORE writing, to a timestamped versions/ path', async () => {
      const res = await PUT(putRequest(BODY));

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.backup).toMatch(
        new RegExp(
          `^${BASE}/jarvis_agent/versions/jarvis_agent_instructions\\.txt\\..+\\.bak$`,
        ),
      );
      // ORDER: copy strictly before save
      expect(copyMock.mock.invocationCallOrder[0]).toBeLessThan(
        saveMock.mock.invocationCallOrder[0],
      );
      expect(saveMock).toHaveBeenCalledWith('You are MORE Jarvis.', {
        contentType: 'text/plain',
      });
    });

    it('a failed backup ABORTS the save — zero writes', async () => {
      copyMock.mockRejectedValue(new Error('backup exploded'));

      const res = await PUT(putRequest(BODY));

      expect(res.status).toBe(502);
      expect(saveMock).not.toHaveBeenCalled();
    });

    it('clean not-found (fresh agent) skips backup and writes, backup: null', async () => {
      copyMock.mockRejectedValue(notFoundError());

      const res = await PUT(putRequest(BODY));

      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ ok: true, backup: null });
      expect(saveMock).toHaveBeenCalledTimes(1);
    });

    it('400 unknown agent — zero GCS calls', async () => {
      const res = await PUT(
        putRequest({ agent_name: 'ghost_agent', content: 'x' }),
      );
      expect(res.status).toBe(400);
      expect(copyMock).not.toHaveBeenCalled();
      expect(saveMock).not.toHaveBeenCalled();
    });

    it('400 when content is not a string', async () => {
      const res = await PUT(putRequest({ agent_name: 'jarvis_agent' }));
      expect(res.status).toBe(400);
      expect(saveMock).not.toHaveBeenCalled();
    });

    it('500 naming the env var when unset', async () => {
      delete process.env.GCS_BUCKET;
      const res = await PUT(putRequest(BODY));
      expect(res.status).toBe(500);
      await expect(res.json()).resolves.toEqual({
        error: 'GCS_BUCKET is not configured',
      });
    });
  });
});
