/**
 * Service contract tests — Phase 2.
 *
 * Verifies each service method returns the SHAPE prescribed by DATA_CONTRACT §2.
 * These tests must continue passing when Phase 3 swaps inline placeholders for
 * real mock data, and when the overall-lifecycle Phase 2 swaps in real backends.
 *
 * Intent (per Rule K9): each test encodes "this method's return value satisfies
 * the contract for downstream UI consumption" — not just "doesn't throw."
 */

import {
  chatService,
  profileService,
  instructionsService,
} from '@/services';
import type { AgentName, AgentSessionMap } from '@/types';

const AGENT: AgentName = 'greeting_agent';
const USER_ID = 'test-user-id';

describe('chatService contract', () => {
  it('sendMessage resolves to a RunAgentResponse shape (response string + session_id string)', async () => {
    const result = await chatService.sendMessage({
      agent_name: AGENT,
      message: 'hello',
      user_id: USER_ID,
      session_id: null,
    });
    expect(typeof result.response).toBe('string');
    expect(typeof result.session_id).toBe('string');
  });

  it('getHistory resolves to a Message[] (array, possibly empty)', async () => {
    const result = await chatService.getHistory({
      agent_name: AGENT,
      user_id: USER_ID,
      session_id: 'test-session',
    });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('profileService contract', () => {
  it('fetchProfile resolves to an AgentSessionMap (plain object)', async () => {
    const result = await profileService.fetchProfile(USER_ID);
    expect(result).not.toBeNull();
    expect(typeof result).toBe('object');
    expect(Array.isArray(result)).toBe(false);
  });

  it('saveProfile resolves to undefined (void)', async () => {
    const sessions: AgentSessionMap = { greeting_agent: 'session-abc' };
    const result = await profileService.saveProfile(USER_ID, sessions);
    expect(result).toBeUndefined();
  });
});

describe('instructionsService contract', () => {
  it('fetchInstructions resolves to a string (InstructionBlob)', async () => {
    const result = await instructionsService.fetchInstructions(AGENT);
    expect(typeof result).toBe('string');
  });

  it('updateInstructions resolves to undefined (void)', async () => {
    const result = await instructionsService.updateInstructions(
      AGENT,
      'new instructions',
    );
    expect(result).toBeUndefined();
  });
});
