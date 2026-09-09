/**
 * service.template.ts
 *
 * Stark Frontend-First: Service Template
 *
 * Copy this file to /src/services/<domain>Service.ts and adapt.
 * Rules:
 *   - Method names are domain-driven, not HTTP-driven
 *   - All return types come from /src/types/
 *   - Mock implementation in this file during frontend-first phase
 *   - Real implementation replaces mock in Phase 2 (Backend Swap)
 */

import type { /* TODO: import your types */ } from '@/types';

// TODO: Rename this file and the exported object to match your domain
// Example: chatService, userService, agentService

export const exampleService = {
  /**
   * getAll — Fetch all items
   *
   * Mock: returns hardcoded data from /src/mocks/data/
   * Real: queries Supabase / wrapper API
   */
  getAll: async (): Promise<any[]> => {
    // Mock phase
    await new Promise(r => setTimeout(r, 200)); // simulate network
    const { exampleData } = await import('@/mocks/data/example');
    return exampleData;

    // Real phase (uncomment when swapping)
    // const { data, error } = await supabase.from('example').select('*');
    // if (error) throw error;
    // return data;
  },

  /**
   * getById — Fetch one item by id
   */
  getById: async (id: string): Promise<any | null> => {
    await new Promise(r => setTimeout(r, 100));
    const { exampleData } = await import('@/mocks/data/example');
    return exampleData.find(item => item.id === id) ?? null;
  },

  /**
   * create — Create a new item
   *
   * Mock: returns a fake item with generated id
   * Real: inserts into backend and returns the created row
   */
  create: async (input: Omit<any, 'id' | 'created_at'>): Promise<any> => {
    await new Promise(r => setTimeout(r, 200));
    return {
      ...input,
      id: `example-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
  },

  /**
   * update — Update an existing item
   */
  update: async (id: string, patch: Partial<any>): Promise<any> => {
    await new Promise(r => setTimeout(r, 200));
    return { id, ...patch, updated_at: new Date().toISOString() };
  },

  /**
   * remove — Delete an item
   */
  remove: async (id: string): Promise<void> => {
    await new Promise(r => setTimeout(r, 100));
    // Mock: no-op
    return;
  },
};

/**
 * BACKEND_SWAP_NOTES for this service:
 *
 * Method          | Endpoint / Operation              | Notes
 * ----------------|-----------------------------------|------
 * getAll          | GET /api/example                  | Paginate?
 * getById         | GET /api/example/:id              | 404 → return null
 * create          | POST /api/example                 | Returns created row
 * update          | PATCH /api/example/:id            | Partial update
 * remove          | DELETE /api/example/:id           | 204 → return void
 *
 * Auth context: <fill in when designing backend>
 * Error handling: <fill in when designing backend>
 */
