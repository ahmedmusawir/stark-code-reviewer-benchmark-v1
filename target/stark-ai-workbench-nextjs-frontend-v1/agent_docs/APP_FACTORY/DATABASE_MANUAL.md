# DATABASE MANUAL

> **Stark Industries Software Factory**  
> *The definitive guide to Supabase PostgreSQL database design, schema patterns, and data management.*

---

## Table of Contents

1. [Philosophy & Strategy](#1-philosophy--strategy)
2. [Schema Design Patterns](#2-schema-design-patterns)
3. [Data Types Reference](#3-data-types-reference)
4. [Relationships & Foreign Keys](#4-relationships--foreign-keys)
5. [Row Level Security (RLS)](#5-row-level-security-rls)
6. [Indexing Strategy](#6-indexing-strategy)
7. [JSONB Patterns](#7-jsonb-patterns)
8. [TypeScript Type Generation](#8-typescript-type-generation)
9. [Query Patterns](#9-query-patterns)
10. [Migration Workflow](#10-migration-workflow)
11. [Data Integrity](#11-data-integrity)
12. [Performance Optimization](#12-performance-optimization)

---

## 1. Philosophy & Strategy

### Schema-First Development

**The database schema is the foundation of every feature.** Before writing any application code:

1. Design the tables
2. Define relationships
3. Set up indexes
4. Generate TypeScript types
5. THEN build service layer and UI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SCHEMA-FIRST WORKFLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │   Design     │ ──► │   Create     │ ──► │   Generate   │
    │   Tables     │     │   in Supabase│     │   TS Types   │
    └──────────────┘     └──────────────┘     └──────────────┘
                                                     │
                                                     ▼
    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │   Build UI   │ ◄── │   Create     │ ◄── │   Build      │
    │              │     │   Stores     │     │   Services   │
    └──────────────┘     └──────────────┘     └──────────────┘
```

### Why Schema-First?

| Benefit | Description |
|---------|-------------|
| **Type Safety** | Generated types prevent runtime errors |
| **API Contract** | Schema defines the data contract |
| **No Rework** | UI matches real data shape from day one |
| **Team Alignment** | Everyone understands the data model |
| **Documentation** | Schema IS the documentation |

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Tables | `snake_case`, plural or prefixed | `orders`, `ghl_qr_orders` |
| Columns | `snake_case` | `order_id`, `created_at` |
| Primary Keys | `id` or `{entity}_id` | `id`, `order_id` |
| Foreign Keys | `{referenced_table}_id` | `user_id`, `order_id` |
| Timestamps | `{action}_at` | `created_at`, `updated_at` |
| Booleans | `is_{property}` or `has_{property}` | `is_active`, `has_shipped` |

---

## 2. Schema Design Patterns

### Basic Table Template

```sql
CREATE TABLE {table_name} (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core Fields
  {field_name} {TYPE} [NOT NULL] [DEFAULT value],
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_{table_name}_{column} ON {table_name}({column});
```

### Master-Detail Pattern (One-to-Many)

```sql
-- Master Table (Orders)
CREATE TABLE orders (
  order_id TEXT PRIMARY KEY,
  customer_email TEXT NOT NULL,
  total NUMERIC,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Detail Table (Order Items)
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  
  -- Foreign Key with CASCADE
  CONSTRAINT fk_order
    FOREIGN KEY (order_id)
    REFERENCES orders(order_id)
    ON DELETE CASCADE
);

-- Index on foreign key
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

### User Mirror Table Pattern

When you need custom user data beyond Supabase Auth:

```sql
-- Mirror table for Supabase Auth users
CREATE TABLE app_users (
  -- Same UUID as Supabase Auth
  id UUID PRIMARY KEY,
  
  -- Additional user data
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member',
  preferences JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX idx_app_users_role ON app_users(role);
```

**Synchronization Logic:**

```typescript
// When creating a user in Supabase Auth
const createUserWithProfile = async (email: string, password: string, profile: UserProfile) => {
  // 1. Create in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: profile.displayName,
      role: profile.role,
    },
  });

  if (authError) throw authError;

  // 2. Create in mirror table with SAME ID
  const { error: profileError } = await supabase
    .from('app_users')
    .insert({
      id: authData.user.id, // Same UUID
      display_name: profile.displayName,
      role: profile.role,
    });

  if (profileError) {
    // Rollback: delete auth user
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw profileError;
  }

  return authData.user;
};
```

### External System Mapping Table

For integrating with external APIs (CRM, payment systems, etc.):

```sql
-- Map external system IDs to local entities
CREATE TABLE external_field_mappings (
  id SERIAL PRIMARY KEY,
  
  -- External system identifiers
  external_product_id TEXT UNIQUE NOT NULL,
  external_field_id TEXT NOT NULL,
  field_name TEXT,
  
  -- Metadata
  system_name TEXT DEFAULT 'ghl', -- 'ghl', 'stripe', 'hubspot', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage: Look up which external field to update for a product
SELECT external_field_id 
FROM external_field_mappings 
WHERE external_product_id = 'prod_123';
```

### Soft Delete Pattern

```sql
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries (exclude deleted)
CREATE INDEX idx_resources_active ON resources(id) WHERE is_deleted = FALSE;

-- RLS policy excludes deleted records
CREATE POLICY "Users see active records only"
ON resources FOR SELECT
USING (is_deleted = FALSE);
```

---

## 3. Data Types Reference

### PostgreSQL Types for Supabase

| Type | Use Case | Example |
|------|----------|---------|
| `UUID` | Primary keys, user IDs | `gen_random_uuid()` |
| `TEXT` | Variable-length strings | Names, emails, IDs |
| `VARCHAR(n)` | Fixed-max strings | Country codes (2 chars) |
| `INTEGER` | Whole numbers | Quantities, counts |
| `BIGINT` | Large whole numbers | Timestamps in ms |
| `NUMERIC` | Precise decimals | Money, prices |
| `BOOLEAN` | True/false flags | `is_active` |
| `TIMESTAMPTZ` | Timestamps with timezone | `created_at` |
| `DATE` | Date only | Birth dates |
| `JSONB` | Flexible structured data | Settings, metadata |
| `TEXT[]` | Arrays of strings | Tags, categories |
| `SERIAL` | Auto-increment integers | Simple IDs |

### When to Use Each Type

```sql
-- UUID for primary keys (distributed-safe)
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- TEXT for external IDs (from other systems)
external_order_id TEXT PRIMARY KEY  -- GHL/Stripe ID

-- NUMERIC for money (never use FLOAT!)
price NUMERIC(10, 2)  -- Up to 99,999,999.99
total NUMERIC         -- Flexible precision

-- TIMESTAMPTZ always (never TIMESTAMP)
created_at TIMESTAMPTZ DEFAULT NOW()

-- JSONB for flexible/dynamic data
metadata JSONB DEFAULT '{}'
settings JSONB DEFAULT '{"theme": "light"}'

-- TEXT[] for simple lists
tags TEXT[] DEFAULT '{}'
```

---

## 4. Relationships & Foreign Keys

### One-to-Many Relationship

```sql
-- Parent: One order
CREATE TABLE orders (
  order_id TEXT PRIMARY KEY,
  customer_email TEXT
);

-- Child: Many tickets per order
CREATE TABLE tickets (
  ticket_id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  ticket_type TEXT,
  status TEXT DEFAULT 'live'
);
```

### Cascade Behaviors

| Option | Behavior |
|--------|----------|
| `ON DELETE CASCADE` | Delete children when parent deleted |
| `ON DELETE SET NULL` | Set FK to NULL when parent deleted |
| `ON DELETE RESTRICT` | Prevent parent deletion if children exist |
| `ON UPDATE CASCADE` | Update FK when parent PK changes |

**Recommendation:** Use `CASCADE` for true child records, `SET NULL` for optional references.

### Many-to-Many Relationship

```sql
-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

-- Junction table
CREATE TABLE product_categories (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- Indexes for both directions
CREATE INDEX idx_pc_product ON product_categories(product_id);
CREATE INDEX idx_pc_category ON product_categories(category_id);
```

### Logical Relationships (No FK)

For external systems where you can't create a true foreign key:

```sql
-- No FK constraint (external system manages the data)
CREATE TABLE orders (
  order_id TEXT PRIMARY KEY,
  external_contact_id TEXT,  -- GHL contact ID (logical relationship)
  external_product_id TEXT   -- GHL product ID (logical relationship)
);

-- Document the relationship in comments
COMMENT ON COLUMN orders.external_contact_id IS 
  'GoHighLevel contact ID. Logical FK - no constraint.';
```

---

## 5. Row Level Security (RLS)

### Enable RLS

```sql
-- ALWAYS enable RLS on tables with user data
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
```

### Common RLS Policies

#### Users See Only Their Own Data

```sql
CREATE POLICY "Users see own records"
ON orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own records"
ON orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own records"
ON orders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own records"
ON orders FOR DELETE
USING (auth.uid() = user_id);
```

#### Role-Based Access

```sql
-- Admins can see all records
CREATE POLICY "Admins see all"
ON orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id
    AND (raw_user_meta_data->>'is_admin')::int = 1
  )
);

-- Or using a custom roles table
CREATE POLICY "Admins see all"
ON orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);
```

#### Public Read, Authenticated Write

```sql
-- Anyone can read
CREATE POLICY "Public read"
ON products FOR SELECT
USING (true);

-- Only authenticated users can insert
CREATE POLICY "Authenticated insert"
ON products FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
```

### Service Role Bypass

When using the service role key (server-side), RLS is bypassed. This is appropriate for:
- API routes
- Background jobs
- Admin operations

```typescript
// Server-side: Service role bypasses RLS
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Bypasses RLS
);
```

---

## 6. Indexing Strategy

### When to Create Indexes

| Create Index When | Example |
|-------------------|---------|
| Column in WHERE clause | `WHERE status = 'active'` |
| Column in ORDER BY | `ORDER BY created_at DESC` |
| Foreign key column | `order_id` in child table |
| Column in JOIN | `ON orders.user_id = users.id` |
| Unique constraint needed | `email` column |

### Index Types

```sql
-- B-tree (default): Equality and range queries
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Composite index: Multiple columns
CREATE INDEX idx_orders_status_date ON orders(status, created_at DESC);

-- Partial index: Subset of rows
CREATE INDEX idx_orders_pending ON orders(created_at) 
WHERE status = 'pending';

-- GIN index: JSONB and arrays
CREATE INDEX idx_orders_metadata ON orders USING GIN (metadata);

-- Unique index
CREATE UNIQUE INDEX idx_users_email ON users(email);
```

### Index Naming Convention

```
idx_{table}_{column}
idx_{table}_{column1}_{column2}  -- Composite
idx_{table}_{column}_{suffix}    -- Partial (e.g., _active, _pending)
```

### Verify Index Usage

```sql
-- Check if index is being used
EXPLAIN ANALYZE
SELECT * FROM orders WHERE status = 'pending';

-- Look for "Index Scan" vs "Seq Scan"
```

---

## 7. JSONB Patterns

### When to Use JSONB

| Use JSONB For | Example |
|---------------|---------|
| Dynamic schemas | User preferences, settings |
| Variable attributes | Product variants, ticket types |
| Nested data | Address objects |
| Sparse data | Optional metadata |

**Don't use JSONB for:** Data you need to join on, frequently queried fields, or relational data.

### JSONB Column Examples

```sql
-- User preferences (varies per user)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  preferences JSONB DEFAULT '{
    "theme": "light",
    "notifications": true,
    "language": "en"
  }'
);

-- Dynamic ticket quantities
CREATE TABLE orders (
  order_id TEXT PRIMARY KEY,
  ticket_quantities JSONB  -- {"VIP": 2, "Regular": 3}
);

-- Flexible metadata
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name TEXT,
  metadata JSONB DEFAULT '{}'  -- Any extra data
);
```

### Querying JSONB

```sql
-- Get a specific key
SELECT preferences->>'theme' as theme FROM users;

-- Filter by JSONB value
SELECT * FROM orders WHERE ticket_quantities->>'VIP' IS NOT NULL;

-- Check if key exists
SELECT * FROM orders WHERE ticket_quantities ? 'VIP';

-- Get integer from JSONB
SELECT order_id, (ticket_quantities->>'VIP')::int as vip_count
FROM orders
WHERE ticket_quantities ? 'VIP';

-- Get all keys
SELECT order_id, jsonb_object_keys(ticket_quantities) as ticket_type
FROM orders;

-- Aggregate JSONB
SELECT order_id,
  (SELECT SUM(value::int) FROM jsonb_each_text(ticket_quantities)) as total_tickets
FROM orders;
```

### JSONB Index

```sql
-- GIN index for containment queries
CREATE INDEX idx_orders_tickets ON orders USING GIN (ticket_quantities);

-- This enables fast queries like:
SELECT * FROM orders WHERE ticket_quantities ? 'VIP';
SELECT * FROM orders WHERE ticket_quantities @> '{"VIP": 2}';
```

### TypeScript with JSONB

```typescript
interface Order {
  order_id: string;
  ticket_quantities: {
    [ticketType: string]: number;
  } | null;
}

// Usage
const order: Order = {
  order_id: 'order_123',
  ticket_quantities: {
    VIP: 2,
    Regular: 3,
  },
};

// Access
const vipCount = order.ticket_quantities?.VIP || 0;

// Iterate
if (order.ticket_quantities) {
  for (const [type, qty] of Object.entries(order.ticket_quantities)) {
    console.log(`${type}: ${qty}`);
  }
}
```

---

## 8. TypeScript Type Generation

### Supabase CLI Type Generation

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Generate types from your project
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

### Using Generated Types

```typescript
// src/types/supabase.ts (generated)
export type Database = {
  public: {
    Tables: {
      orders: {
        Row: {
          order_id: string;
          customer_email: string | null;
          total: number | null;
          status: string | null;
          created_at: string;
        };
        Insert: {
          order_id: string;
          customer_email?: string | null;
          total?: number | null;
          status?: string | null;
          created_at?: string;
        };
        Update: {
          order_id?: string;
          customer_email?: string | null;
          total?: number | null;
          status?: string | null;
          created_at?: string;
        };
      };
    };
  };
};

// Usage in service
import { Database } from '@/types/supabase';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];

const createOrder = async (order: OrderInsert): Promise<Order> => {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

### Manual Type Definitions

If not using CLI generation:

```typescript
// src/types/database.ts

export interface Order {
  order_id: string;
  location_id: string | null;
  total_paid: number | null;
  payment_status: string | null;
  payment_currency: string | null;
  order_status: string | null;
  contact_id: string | null;
  contact_firstname: string | null;
  contact_lastname: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  date_added: string | null;
  event_id: string | null;
  event_name: string | null;
  ticket_quantities: Record<string, number> | null;
  qr_code_image: string | null;
  inserted_at: string;
  updated_at: string;
}

export interface Ticket {
  ticket_id: number;
  order_id: string;
  ticket_type: string;
  status: 'live' | 'used' | 'cancelled';
}

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  created_at: string;
}
```

---

## 9. Query Patterns

### Basic CRUD

```typescript
// CREATE
const { data, error } = await supabase
  .from('orders')
  .insert({ order_id: 'new_123', customer_email: 'test@test.com' })
  .select()
  .single();

// READ (single)
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('order_id', 'order_123')
  .single();

// READ (list with filter)
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('status', 'pending')
  .order('created_at', { ascending: false })
  .limit(20);

// UPDATE
const { data, error } = await supabase
  .from('orders')
  .update({ status: 'completed' })
  .eq('order_id', 'order_123')
  .select()
  .single();

// DELETE
const { error } = await supabase
  .from('orders')
  .delete()
  .eq('order_id', 'order_123');
```

### Upsert Pattern

```typescript
// Insert or update based on primary key
const { data, error } = await supabase
  .from('orders')
  .upsert(
    {
      order_id: 'order_123', // PK for conflict detection
      customer_email: 'updated@test.com',
      total: 150,
    },
    { onConflict: 'order_id' }
  )
  .select()
  .single();
```

### Batch Insert

```typescript
// Insert multiple records
const tickets = [
  { order_id: 'order_123', ticket_type: 'VIP', status: 'live' },
  { order_id: 'order_123', ticket_type: 'VIP', status: 'live' },
  { order_id: 'order_123', ticket_type: 'Regular', status: 'live' },
];

const { data, error } = await supabase
  .from('tickets')
  .insert(tickets)
  .select();
```

### Avoid N+1 Queries

```typescript
// ❌ BAD: N+1 problem
const orders = await fetchOrders();
for (const order of orders) {
  const tickets = await fetchTickets(order.order_id); // N queries!
  order.tickets = tickets;
}

// ✅ GOOD: Batch fetch
const orders = await fetchOrders();
const orderIds = orders.map((o) => o.order_id);

const { data: allTickets } = await supabase
  .from('tickets')
  .select('*')
  .in('order_id', orderIds); // 1 query!

// Group by order_id
const ticketsByOrder = allTickets.reduce((acc, ticket) => {
  if (!acc[ticket.order_id]) acc[ticket.order_id] = [];
  acc[ticket.order_id].push(ticket);
  return acc;
}, {} as Record<string, Ticket[]>);

// Attach to orders
orders.forEach((order) => {
  order.tickets = ticketsByOrder[order.order_id] || [];
});
```

### Aggregation Queries

```sql
-- Count by status
SELECT status, COUNT(*) as count
FROM tickets
GROUP BY status;

-- Sum revenue by event
SELECT 
  event_id,
  event_name,
  SUM(total_paid) as total_revenue,
  COUNT(*) as order_count
FROM orders
WHERE payment_status = 'paid'
GROUP BY event_id, event_name;

-- Tickets with order info
SELECT 
  t.*,
  o.event_name,
  o.contact_email
FROM tickets t
JOIN orders o ON t.order_id = o.order_id
WHERE t.status = 'live';
```

---

## 10. Migration Workflow

### Initial Setup

Run in Supabase SQL Editor:

```sql
-- 1. Create tables
CREATE TABLE orders (
  order_id TEXT PRIMARY KEY,
  customer_email TEXT,
  total NUMERIC,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tickets (
  ticket_id SERIAL PRIMARY KEY,
  order_id TEXT REFERENCES orders(order_id) ON DELETE CASCADE,
  ticket_type TEXT NOT NULL,
  status TEXT DEFAULT 'live'
);

-- 2. Create indexes
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_tickets_order_id ON tickets(order_id);
CREATE INDEX idx_tickets_status ON tickets(status);

-- 3. Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- 4. Create policies (as needed)
```

### Adding Columns

```sql
-- Add a new column
ALTER TABLE orders
ADD COLUMN discount_code TEXT;

-- Add column with default
ALTER TABLE orders
ADD COLUMN is_gift BOOLEAN DEFAULT FALSE;

-- Add NOT NULL column (requires default or backfill)
ALTER TABLE orders
ADD COLUMN currency TEXT DEFAULT 'USD' NOT NULL;
```

### Adding Indexes

```sql
-- Add index for new query pattern
CREATE INDEX idx_orders_discount ON orders(discount_code);

-- Add composite index
CREATE INDEX idx_orders_status_date ON orders(status, created_at DESC);
```

### Renaming

```sql
-- Rename column
ALTER TABLE orders
RENAME COLUMN customer_email TO contact_email;

-- Rename table
ALTER TABLE old_table_name
RENAME TO new_table_name;
```

### Safe Migration Practices

1. **Always backup first** (Supabase has automatic backups)
2. **Test in staging** before production
3. **Add columns as nullable** first, then backfill, then add NOT NULL
4. **Never drop columns** in production without verification
5. **Create indexes CONCURRENTLY** to avoid locking

```sql
-- Create index without blocking writes
CREATE INDEX CONCURRENTLY idx_orders_email ON orders(contact_email);
```

---

## 11. Data Integrity

### Constraint Patterns

```sql
-- NOT NULL: Required field
email TEXT NOT NULL

-- UNIQUE: No duplicates
email TEXT UNIQUE

-- CHECK: Value validation
status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'cancelled'))
age INTEGER CHECK (age >= 0 AND age <= 150)

-- DEFAULT: Auto-fill value
created_at TIMESTAMPTZ DEFAULT NOW()
status TEXT DEFAULT 'pending'

-- FOREIGN KEY: Referential integrity
FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
```

### Validation Queries

```sql
-- Find orphaned records (should return 0)
SELECT t.*
FROM tickets t
LEFT JOIN orders o ON t.order_id = o.order_id
WHERE o.order_id IS NULL;

-- Find duplicate emails
SELECT email, COUNT(*)
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Find records with invalid status
SELECT * FROM orders
WHERE status NOT IN ('pending', 'processing', 'completed', 'cancelled');
```

### Application-Level Integrity

```typescript
// Verify ticket count matches order
const verifyTicketCount = async (orderId: string) => {
  const { data: order } = await supabase
    .from('orders')
    .select('ticket_quantities')
    .eq('order_id', orderId)
    .single();

  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('order_id', orderId);

  const expectedTotal = Object.values(order.ticket_quantities || {})
    .reduce((sum, qty) => sum + qty, 0);

  if (count !== expectedTotal) {
    console.warn(`Ticket count mismatch: ${count} vs ${expectedTotal}`);
    return false;
  }
  return true;
};
```

### Transaction Pattern (Pseudo-Transaction)

Supabase JS doesn't support true transactions, but you can handle rollbacks:

```typescript
const createOrderWithTickets = async (
  orderData: Order,
  ticketTypes: Record<string, number>
) => {
  // 1. Insert order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  if (orderError) throw orderError;

  // 2. Insert tickets
  const tickets = [];
  for (const [type, qty] of Object.entries(ticketTypes)) {
    for (let i = 0; i < qty; i++) {
      tickets.push({
        order_id: order.order_id,
        ticket_type: type,
        status: 'live',
      });
    }
  }

  const { error: ticketsError } = await supabase
    .from('tickets')
    .insert(tickets);

  if (ticketsError) {
    // Rollback: delete the order (tickets cascade)
    await supabase.from('orders').delete().eq('order_id', order.order_id);
    throw ticketsError;
  }

  return order;
};
```

---

## 12. Performance Optimization

### Query Optimization Checklist

- [ ] Use indexes for WHERE, ORDER BY, JOIN columns
- [ ] Avoid `SELECT *` - specify columns
- [ ] Use pagination for large result sets
- [ ] Avoid N+1 queries (batch fetch)
- [ ] Use `count: 'exact'` only when needed
- [ ] Cache frequently accessed data

### Pagination Patterns

```typescript
// Offset-based (simple, but slow for large offsets)
const { data } = await supabase
  .from('orders')
  .select('*')
  .order('created_at', { ascending: false })
  .range(0, 19); // First 20 records

// Cursor-based (better for large datasets)
const { data } = await supabase
  .from('orders')
  .select('*')
  .order('created_at', { ascending: false })
  .lt('created_at', lastCreatedAt) // Cursor
  .limit(20);
```

### Caching Strategy

```typescript
// Cache static data in memory or localStorage
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

let cachedEvents: Event[] | null = null;
let cacheTimestamp = 0;

const getEvents = async (): Promise<Event[]> => {
  const now = Date.now();
  
  if (cachedEvents && now - cacheTimestamp < CACHE_DURATION) {
    return cachedEvents;
  }

  const { data } = await supabase.from('events').select('*');
  cachedEvents = data || [];
  cacheTimestamp = now;
  
  return cachedEvents;
};
```

### Connection Pooling

Supabase handles connection pooling automatically. For high-traffic apps:

1. Use the pooler connection string (port 6543)
2. Keep connections short-lived
3. Don't hold connections during long operations

---

## Quick Reference

### Common SQL Commands

```sql
-- Create table
CREATE TABLE name (columns);

-- Add column
ALTER TABLE name ADD COLUMN col TYPE;

-- Add index
CREATE INDEX idx_name ON table(col);

-- Enable RLS
ALTER TABLE name ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "name" ON table FOR action USING (condition);

-- Upsert
INSERT INTO table (cols) VALUES (vals)
ON CONFLICT (pk) DO UPDATE SET col = val;
```

### Supabase JS Cheat Sheet

```typescript
// Select
supabase.from('table').select('*').eq('col', 'val')

// Insert
supabase.from('table').insert({ col: 'val' }).select()

// Update
supabase.from('table').update({ col: 'val' }).eq('id', 1)

// Delete
supabase.from('table').delete().eq('id', 1)

// Upsert
supabase.from('table').upsert({ id: 1, col: 'val' })

// Count
supabase.from('table').select('*', { count: 'exact', head: true })

// Order & Limit
supabase.from('table').select('*').order('col', { ascending: false }).limit(10)

// Pagination
supabase.from('table').select('*').range(0, 9)

// Filter operators
.eq('col', 'val')      // Equal
.neq('col', 'val')     // Not equal
.gt('col', 10)         // Greater than
.lt('col', 10)         // Less than
.gte('col', 10)        // Greater or equal
.lte('col', 10)        // Less or equal
.like('col', '%val%')  // Pattern match
.ilike('col', '%val%') // Case-insensitive pattern
.in('col', [1, 2, 3])  // In array
.is('col', null)       // Is null
```

---

*This manual is part of the Stark Industries Software Factory documentation suite.*
