/**
 * ADK event fixtures — the wrapper-era oracle, encoded (BIM-002).
 *
 * FLAG-1 ruling: detection is `content.role === "model"`, never author —
 * canonical ADK events carry `author: "<agent_name>"`, so fixtures encode
 * BOTH author styles and both must parse identically.
 */

import type { Message } from '@/types';

/** Canonical ADK style: author is the agent's name, content.role = "model". */
export const happyPathEvents = [
  {
    id: 'ev-1',
    author: 'user',
    content: { role: 'user', parts: [{ text: 'hello' }] },
  },
  {
    id: 'ev-2',
    author: 'greeting_agent',
    content: { role: 'model', parts: [{ text: 'Hi there! How can I help?' }] },
  },
];
export const happyPathExpected = 'Hi there! How can I help?';

/**
 * Multi-event run: function_call + intermediate model text + final model
 * text. Reversed scan must select the LAST model text ("Final answer: 42").
 */
export const multiEventRun = [
  {
    id: 'ev-1',
    author: 'user',
    content: { role: 'user', parts: [{ text: 'what is 6x7?' }] },
  },
  {
    id: 'ev-2',
    author: 'calc_agent',
    content: {
      role: 'model',
      parts: [{ functionCall: { name: 'calculate', args: { expr: '6*7' } } }],
    },
  },
  {
    id: 'ev-3',
    author: 'calc_agent',
    content: {
      role: 'user',
      parts: [{ functionResponse: { name: 'calculate', response: { result: 42 } } }],
    },
  },
  {
    id: 'ev-4',
    author: 'calc_agent',
    content: { role: 'model', parts: [{ text: 'Thinking it through...' }] },
  },
  {
    id: 'ev-5',
    author: 'calc_agent',
    content: { role: 'model', parts: [{ text: 'Final answer: 42' }] },
  },
];
export const multiEventExpected = 'Final answer: 42';

/** Wrapper-era alternate style: author literally "model" (FLAG-1 tolerance). */
export const authorModelStyleEvents = [
  {
    id: 'ev-1',
    author: 'user',
    content: { role: 'user', parts: [{ text: 'ping' }] },
  },
  {
    id: 'ev-2',
    author: 'model',
    content: { role: 'model', parts: [{ text: 'pong' }] },
  },
];
export const authorModelStyleExpected = 'pong';

/** The retry trigger: ADK's session-not-found error body. */
export const sessionNotFound404 = { detail: 'Session not found' };

/** A run that produced nothing usable → 502, never a crash. */
export const emptyEvents: unknown[] = [];

/** Structurally broken events: no parts / non-text parts only / no content. */
export const malformedEvents = [
  { id: 'ev-1', author: 'greeting_agent' },
  { id: 'ev-2', author: 'greeting_agent', content: { role: 'model' } },
  {
    id: 'ev-3',
    author: 'greeting_agent',
    content: { role: 'model', parts: [{ functionCall: { name: 'noop' } }] },
  },
];

/**
 * History: a session object with mixed turns + a skippable non-text event.
 * Expected normalization alongside (order oldest→newest).
 */
export const historySession = {
  id: 'session-1700000000000',
  app_name: 'jarvis_agent',
  user_id: 'u-1',
  events: [
    {
      id: 'ev-1',
      author: 'user',
      content: { role: 'user', parts: [{ text: 'hello jarvis' }] },
    },
    {
      id: 'ev-2',
      author: 'jarvis_agent',
      content: {
        role: 'model',
        parts: [{ functionCall: { name: 'lookup', args: {} } }],
      },
    },
    {
      id: 'ev-3',
      author: 'jarvis_agent',
      content: { role: 'model', parts: [{ text: 'Hello sir. At your service.' }] },
    },
    {
      id: 'ev-4',
      author: 'user',
      content: { role: 'user', parts: [{ text: 'status report' }] },
    },
    {
      id: 'ev-5',
      author: 'jarvis_agent',
      content: { role: 'model', parts: [{ text: 'All systems nominal.' }] },
    },
  ],
};
export const historySessionExpected: Message[] = [
  { role: 'user', content: 'hello jarvis' },
  { role: 'assistant', content: 'Hello sir. At your service.' },
  { role: 'user', content: 'status report' },
  { role: 'assistant', content: 'All systems nominal.' },
];

/** The N7 scenario: a valid session whose events array is empty. */
export const historyEmptySession = {
  id: 'session-1784364468',
  app_name: 'greeting_agent',
  user_id: 'u-1',
  events: [],
};
