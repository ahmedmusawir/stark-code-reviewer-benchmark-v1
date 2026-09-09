/**
 * mock-data.template.ts
 *
 * Stark Frontend-First: Mock Data Template
 *
 * Copy this file to /src/mocks/data/<entity>.ts and adapt.
 * Rules:
 *   - Match the type from /src/types/ exactly
 *   - Use realistic data (no Lorem ipsum, no "Test 1, Test 2")
 *   - Cover happy path + edge cases + edge state coverage
 *   - Quantity: 5-20 items typical, more for list-heavy demos
 *   - Components NEVER import this file directly — only services do
 */

import type { /* TODO: import the entity type */ } from '@/types';

// TODO: Rename this file and the exported constant to match your entity
// Example: messages, users, agents, products

export const exampleData: any[] = [
  // === HAPPY PATH (realistic typical items) ===
  {
    id: 'example-001',
    name: 'Realistic Item One',
    status: 'active',
    created_at: '2026-05-20T10:00:00Z',
  },
  {
    id: 'example-002',
    name: 'Another Realistic Item',
    status: 'active',
    created_at: '2026-05-21T14:30:00Z',
  },

  // === EDGE CASE: long text ===
  {
    id: 'example-003',
    name: 'Item with an unusually long name that tests how the UI handles overflow and wrapping in dense list views',
    status: 'active',
    created_at: '2026-05-22T08:15:00Z',
  },

  // === EDGE CASE: special characters ===
  {
    id: 'example-004',
    name: "Item with 'quotes' & ampersands & émojis 🚀",
    status: 'active',
    created_at: '2026-05-22T09:00:00Z',
  },

  // === EDGE CASE: different status ===
  {
    id: 'example-005',
    name: 'Inactive Item',
    status: 'inactive',
    created_at: '2026-04-01T00:00:00Z',
  },

  // === EDGE CASE: oldest item ===
  {
    id: 'example-006',
    name: 'Very Old Item',
    status: 'archived',
    created_at: '2025-01-01T00:00:00Z',
  },
];

// === EMPTY STATE HELPER ===
// Use this when you want to demo the empty state
export const exampleDataEmpty: any[] = [];

// === ERROR STATE HELPER ===
// Service files can check for this special query/id and throw
export const TRIGGER_ERROR_ID = 'trigger-error';

/**
 * Notes for mock data realism:
 *
 * - Dates: use ISO format, vary across recent and older
 * - IDs: pattern like `<entity>-NNN` is readable and stable
 * - Names/text: write what a real user would write
 * - Status fields: cover ALL enum values from the data contract
 * - Optional fields: some items have them, some don't
 *
 * If your stakeholder demo includes a search, make sure the mock data
 * has items that match common search queries they'll try.
 */
