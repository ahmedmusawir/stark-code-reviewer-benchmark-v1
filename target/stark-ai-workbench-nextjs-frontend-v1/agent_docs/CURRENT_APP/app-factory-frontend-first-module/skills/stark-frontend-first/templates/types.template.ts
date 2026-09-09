/**
 * types.template.ts
 *
 * Stark Frontend-First: Type Template
 *
 * Copy this file to /src/types/<Entity>.ts and adapt.
 * Rules:
 *   - Field names match DATA_CONTRACT.md exactly
 *   - Optionality matches the contract (`?` vs required)
 *   - Enums use string literal unions
 *   - Both mock and real implementations satisfy this interface
 *   - Never use `any`. If you don't know the type, ask before assuming.
 */

// TODO: Rename to match your entity
// Example: User, Message, Agent, Product

export interface ExampleEntity {
  // Core identity
  id: string;

  // Required fields
  name: string;
  status: ExampleStatus;

  // Optional fields (only mark `?` if DATA_CONTRACT says so)
  description?: string;

  // Timestamps
  created_at: string; // ISO format
  updated_at?: string;
}

// Enum as string literal union (Stark convention — no `enum` keyword)
export type ExampleStatus = 'active' | 'inactive' | 'archived';

// Request shape (if you have create/update operations)
export interface CreateExampleInput {
  name: string;
  description?: string;
  status?: ExampleStatus; // defaults to 'active' on backend
}

export interface UpdateExampleInput {
  name?: string;
  description?: string;
  status?: ExampleStatus;
}

// Response shape (if API returns more than just the entity)
export interface ExampleListResponse {
  items: ExampleEntity[];
  total: number;
  page?: number;
  pageSize?: number;
}

/**
 * Type discipline notes:
 *
 * - Use `string` for IDs unless the contract specifies UUID/number
 * - Use ISO strings for dates, not Date objects (better serialization)
 * - Use string literal unions over `enum` keyword (Stark convention)
 * - Never use `any` — if truly unknown, use `unknown` and narrow
 * - Mark fields optional ONLY if DATA_CONTRACT.md says they're optional
 *
 * If the data contract is ambiguous, STOP and ask the operator.
 * Do not assume optionality. Do not assume nullability.
 */
