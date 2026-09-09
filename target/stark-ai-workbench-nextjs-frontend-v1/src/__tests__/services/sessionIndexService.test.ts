/**
 * Unit tests for sessionIndexService in mock mode (BIM-004).
 * Intent (Rule K9): index CRUD semantics — list order, row birth, touch,
 * rename, archive-hides — plus the D3 title helper and the P-G5 doctrine
 * check (rows carry index fields ONLY, never message content).
 */

import {
  sessionIndexService,
  titleFromMessage,
} from '@/services/sessionIndexService';
import {
  mockSessionIndex,
  resetMockSessionIndex,
} from '@/mocks/data/sessionIndex';

describe('titleFromMessage (D3)', () => {
  it('passes short messages through', () => {
    expect(titleFromMessage('Hello there')).toBe('Hello there');
  });

  it('truncates ~50 chars with an ellipsis', () => {
    const long =
      'This is a very long first message that should be cut off at fifty characters';
    const title = titleFromMessage(long);
    expect(title.endsWith('…')).toBe(true);
    expect(title.length).toBeLessThanOrEqual(51);
    expect(title.startsWith('This is a very long first message')).toBe(true);
  });

  it('collapses whitespace and falls back for empty input', () => {
    expect(titleFromMessage('  hello \n world  ')).toBe('hello world');
    expect(titleFromMessage('   ')).toBe('New chat');
  });
});

describe('sessionIndexService (mock mode)', () => {
  beforeEach(() => {
    resetMockSessionIndex();
  });

  it('lists only the agent’s non-archived sessions, newest-first', async () => {
    await sessionIndexService.createSession('greeting_agent', 'session-2', 'Newer');
    const list = await sessionIndexService.listSessions('greeting_agent');
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list[0].title).toBe('Newer'); // created now > seeded 2026-07-01
    expect(list.every((s) => s.agent_name === 'greeting_agent')).toBe(true);
    expect(list.every((s) => !s.archived)).toBe(true);
  });

  it('createSession births a row with the given title (D2)', async () => {
    const entry = await sessionIndexService.createSession(
      'calc_agent',
      'session-99',
      'Math question',
    );
    expect(entry).not.toBeNull();
    expect(entry!.adk_session_id).toBe('session-99');
    expect(entry!.title).toBe('Math question');
    const list = await sessionIndexService.listSessions('calc_agent');
    expect(list.map((s) => s.id)).toContain(entry!.id);
  });

  it('touchSession bumps updated_at', async () => {
    const entry = await sessionIndexService.createSession(
      'calc_agent',
      'session-99',
      'T',
    );
    const before = entry!.updated_at;
    await new Promise((r) => setTimeout(r, 5));
    await sessionIndexService.touchSession(entry!.id);
    const list = await sessionIndexService.listSessions('calc_agent');
    const touched = list.find((s) => s.id === entry!.id)!;
    expect(touched.updated_at >= before).toBe(true);
  });

  it('renameSession changes the title', async () => {
    const entry = await sessionIndexService.createSession(
      'calc_agent',
      'session-99',
      'Old name',
    );
    await sessionIndexService.renameSession(entry!.id, 'New name');
    const list = await sessionIndexService.listSessions('calc_agent');
    expect(list.find((s) => s.id === entry!.id)!.title).toBe('New name');
  });

  it('archiveSession hides the row from the default list (P-G3)', async () => {
    const entry = await sessionIndexService.createSession(
      'calc_agent',
      'session-99',
      'Bye',
    );
    await sessionIndexService.archiveSession(entry!.id);
    const list = await sessionIndexService.listSessions('calc_agent');
    expect(list.map((s) => s.id)).not.toContain(entry!.id);
    // archived, not deleted — the row survives in the store
    expect(mockSessionIndex.find((s) => s.id === entry!.id)!.archived).toBe(true);
  });

  it('P-G5: rows carry index fields ONLY — never message content', async () => {
    const entry = await sessionIndexService.createSession(
      'calc_agent',
      'session-99',
      titleFromMessage('what is 6x7?'),
    );
    expect(Object.keys(entry!).sort()).toEqual([
      'adk_session_id',
      'agent_name',
      'archived',
      'created_at',
      'id',
      'title',
      'updated_at',
    ]);
  });
});
