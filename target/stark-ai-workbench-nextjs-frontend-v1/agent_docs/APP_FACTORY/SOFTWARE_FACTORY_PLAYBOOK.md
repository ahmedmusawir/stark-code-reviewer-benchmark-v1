# SOFTWARE FACTORY PLAYBOOK

> **Stark Industries Software Factory**  
> *The master guide to building production-ready applications with AI assistance.*

---

## Table of Contents

1. [Philosophy: Human Architect, AI Builder](#1-philosophy-human-architect-ai-builder)
2. [The Build Phases](#2-the-build-phases)
3. [Phase 1: Planning & User Stories](#3-phase-1-planning--user-stories)
4. [Phase 2: Design System](#4-phase-2-design-system)
5. [Phase 3: Database Schema](#5-phase-3-database-schema)
6. [Phase 4: API & Services](#6-phase-4-api--services)
7. [Phase 5: State Management](#7-phase-5-state-management)
8. [Phase 6: UI Implementation](#8-phase-6-ui-implementation)
9. [Phase 7: Authentication & RBAC](#9-phase-7-authentication--rbac)
10. [Phase 8: Integration & Testing](#10-phase-8-integration--testing)
11. [Phase 9: Deployment](#11-phase-9-deployment)
12. [Feature Spec Template](#12-feature-spec-template)
13. [Checklists](#13-checklists)
14. [Manual Reference Guide](#14-manual-reference-guide)

---

## 1. Philosophy: Human Architect, AI Builder

### The Stark Software Factory Model

This is **NOT** a "vibe coding" environment where AI generates random solutions.

This is a **disciplined factory** where:
- **Humans** define the architecture, constraints, and acceptance criteria
- **AI** executes the implementation within those guardrails
- **Manuals** provide the institutional knowledge and patterns

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STARK SOFTWARE FACTORY MODEL                              │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────────────────┐
    │                        HUMAN (ARCHITECT)                          │
    │                                                                    │
    │   • Defines user stories and acceptance criteria                  │
    │   • Approves designs and UI patterns                              │
    │   • Specifies database schema requirements                        │
    │   • Sets constraints and guardrails                               │
    │   • Reviews and approves deliverables                             │
    └────────────────────────────┬─────────────────────────────────────┘
                                 │
                                 │ SPEC + CONSTRAINTS
                                 ▼
    ┌──────────────────────────────────────────────────────────────────┐
    │                         AI (BUILDER)                              │
    │                                                                    │
    │   • Implements features according to spec                         │
    │   • Follows patterns from manuals                                 │
    │   • Generates code within constraints                             │
    │   • Reports progress and blockers                                 │
    │   • Asks clarifying questions when needed                         │
    └────────────────────────────┬─────────────────────────────────────┘
                                 │
                                 │ REFERENCES
                                 ▼
    ┌──────────────────────────────────────────────────────────────────┐
    │                    MANUALS (KNOWLEDGE BASE)                       │
    │                                                                    │
    │   • UI-UX-BUILDING-MANUAL.md                                      │
    │   • AUTH_MANUAL.md                                                │
    │   • DATABASE_MANUAL.md                                            │
    │   • API_AND_SERVICES_MANUAL.md                                    │
    │   • STATE_MANAGEMENT_MANUAL.md                                    │
    │   • APP_ARCHITECTURE_MANUAL.md                                    │
    │   • ECOMMERCE_AND_PAYMENTS_MANUAL.md                              │
    └──────────────────────────────────────────────────────────────────┘
```

### Key Principles

| Principle | Description |
|-----------|-------------|
| **Schema-First** | Database design precedes application code |
| **Spec-Driven** | No implementation without approved spec |
| **Pattern-Based** | Use established patterns from manuals |
| **Incremental** | Build in small, testable increments |
| **Documentation** | Code is documented as it's built |

---

## 2. The Build Phases

Every feature follows this sequence:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        BUILD PHASE SEQUENCE                                 │
└────────────────────────────────────────────────────────────────────────────┘

  PHASE 1          PHASE 2          PHASE 3          PHASE 4
  ────────         ────────         ────────         ────────
  Planning    ──►  Design      ──►  Database    ──►  API
  & Stories        System           Schema           Services

       │                                                  │
       │                                                  │
       ▼                                                  ▼

  PHASE 5          PHASE 6          PHASE 7          PHASE 8
  ────────         ────────         ────────         ────────
  State       ──►  UI          ──►  Auth &      ──►  Integration
  Management       Implementation   RBAC             & Testing

                                                          │
                                                          │
                                                          ▼

                                                     PHASE 9
                                                     ────────
                                                     Deployment
```

### Why This Order?

| Phase | Why It Comes Before the Next |
|-------|------------------------------|
| Planning | Can't design without knowing what to build |
| Design | Can't model data without knowing the UI needs |
| Database | Can't build APIs without knowing the data shape |
| API | Can't manage state without knowing what data exists |
| State | Can't build UI without knowing where data comes from |
| UI | Can't add auth without having something to protect |
| Auth | Can't test without all pieces in place |
| Testing | Can't deploy untested code |

---

## 3. Phase 1: Planning & User Stories

### Objective

Transform a feature idea into actionable user stories with clear acceptance criteria.

### AI Tools for Planning

| Tool | Best For | Notes |
|------|----------|-------|
| **Gemini Pro** | Initial brainstorming | Good at exploring possibilities |
| **Claude Sonnet/Opus** | Refining specs | Better at precise requirements |
| **ChatGPT** | User story generation | Good conversational refinement |

### User Story Format

```markdown
## User Story: [Short Title]

**As a** [user role]
**I want to** [action/goal]
**So that** [benefit/reason]

### Acceptance Criteria

- [ ] Given [precondition], when [action], then [result]
- [ ] Given [precondition], when [action], then [result]
- [ ] Given [precondition], when [action], then [result]

### Out of Scope

- [What this story does NOT include]

### Dependencies

- [Other stories or systems this depends on]

### Technical Notes

- [Any known technical considerations]
```

### Example User Story

```markdown
## User Story: Admin Views Order List

**As an** Admin user
**I want to** see a paginated list of all orders
**So that** I can manage and track customer purchases

### Acceptance Criteria

- [ ] Given I am logged in as Admin, when I navigate to /orders, then I see a table of orders
- [ ] Given the orders table is displayed, when I scroll, then more orders load (pagination)
- [ ] Given an order in the table, when I click it, then I navigate to the order detail page
- [ ] Given the orders table, when I type in search, then orders filter by email or order ID

### Out of Scope

- Editing orders (separate story)
- Bulk actions (separate story)

### Dependencies

- Auth system must be in place
- Orders table must exist in database

### Technical Notes

- Use offset pagination for simplicity
- Cache order list in Zustand for client-side filtering
```

### Deliverables

- [ ] All user stories written
- [ ] Acceptance criteria defined
- [ ] Dependencies identified
- [ ] Stories prioritized (P0, P1, P2)

---

## 4. Phase 2: Design System

### Objective

Create or collect UI designs that define the visual implementation.

### Design Workflow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User Story    │ ──► │  Google Stitch  │ ──► │  Design Output  │
│                 │     │  or Figma       │     │  (Image + HTML) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  Design Spec    │
                                               │  Document       │
                                               └─────────────────┘
```

### Design Spec Document

For each screen/component:

```markdown
## Screen: [Name]

### Layout
- [Description of layout structure]
- [Grid/flex usage]
- [Responsive breakpoints]

### Components Used
- [ ] Card (shadcn)
- [ ] Table (shadcn)
- [ ] Button variants
- [ ] Custom components needed

### Colors & Typography
- Background: `bg-slate-50`
- Headers: `text-4xl font-extrabold`
- Body: `text-base text-slate-600`

### Interactions
- Hover states
- Loading states
- Empty states
- Error states

### Reference Images
- [Link to design image]
- [Link to exported HTML if available]
```

### Deliverables

- [ ] Screen designs for all user stories
- [ ] Component inventory
- [ ] Design spec documents
- [ ] Responsive breakpoint decisions

---

## 5. Phase 3: Database Schema

### Objective

Design and implement the database schema before any application code.

### Schema Design Process

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  User Stories   │ ──► │  Identify       │ ──► │  Design Tables  │
│  + Designs      │     │  Entities       │     │  + Columns      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Run SQL in     │ ◄── │  Add Indexes    │ ◄── │  Define         │
│  Supabase       │     │  + RLS          │     │  Relationships  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  Generate TS    │
                                               │  Types          │
                                               └─────────────────┘
```

### Schema Spec Template

```markdown
## Table: [table_name]

### Purpose
[What this table stores]

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| ... | ... | ... | ... | ... |

### Relationships

- [FK to other_table on column_name]

### Indexes

- idx_{table}_{column} on {column}

### RLS Policies

- [Policy name]: [Description]

### SQL

```sql
CREATE TABLE {table_name} (
  ...
);
```
```

### Deliverables

- [ ] Entity relationship diagram
- [ ] SQL for all tables
- [ ] Indexes defined
- [ ] RLS policies written
- [ ] TypeScript types generated
- [ ] Tables created in Supabase

**Reference:** `DATABASE_MANUAL.md`

---

## 6. Phase 4: API & Services

### Objective

Build the service layer and API routes that interact with the database and external systems.

### Service Layer Structure

```
src/
├── services/
│   ├── orderServices.ts      # Order CRUD operations
│   ├── ticketServices.ts     # Ticket operations
│   ├── userServices.ts       # User operations
│   └── crmServices.ts        # External CRM integration
└── app/
    └── api/
        ├── orders/
        │   ├── route.ts          # GET /api/orders
        │   └── [id]/route.ts     # GET /api/orders/:id
        ├── webhooks/
        │   └── crm/route.ts      # POST /api/webhooks/crm
        └── sync/
            └── route.ts          # GET /api/sync
```

### Service Function Template

```typescript
// src/services/{entity}Services.ts

import { createClient } from '@/utils/supabase/server';
import type { Entity, EntityInsert } from '@/types/database';

export const fetchEntities = async (): Promise<Entity[]> => {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('entities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching entities:', error);
    return [];
  }

  return data;
};

export const fetchEntityById = async (id: string): Promise<Entity | null> => {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('entities')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching entity:', error);
    return null;
  }

  return data;
};

export const createEntity = async (entity: EntityInsert): Promise<Entity | null> => {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('entities')
    .insert(entity)
    .select()
    .single();

  if (error) {
    console.error('Error creating entity:', error);
    return null;
  }

  return data;
};
```

### Deliverables

- [ ] Service functions for all entities
- [ ] API routes for client-side access
- [ ] Webhook endpoints if needed
- [ ] External API integrations
- [ ] Error handling in place

**Reference:** `API_AND_SERVICES_MANUAL.md`

---

## 7. Phase 5: State Management

### Objective

Create Zustand stores that manage client-side state and connect to the service layer.

### Store Structure

```
src/
└── store/
    ├── useAuthStore.ts       # Authentication state
    ├── useOrderStore.ts      # Orders state
    ├── useTicketStore.ts     # Tickets state
    └── useSyncStore.ts       # Sync progress state
```

### Store Template

```typescript
// src/store/use{Entity}Store.ts

import { create } from 'zustand';
import type { Entity } from '@/types/database';

interface EntityState {
  // Data
  entities: Entity[];
  selectedEntity: Entity | null;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchEntities: () => Promise<void>;
  selectEntity: (id: string) => void;
  clearSelection: () => void;
}

export const useEntityStore = create<EntityState>((set, get) => ({
  // Initial state
  entities: [],
  selectedEntity: null,
  isLoading: false,
  error: null,

  // Actions
  fetchEntities: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/entities');
      const { data } = await response.json();
      set({ entities: data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch entities', isLoading: false });
    }
  },

  selectEntity: (id: string) => {
    const entity = get().entities.find((e) => e.id === id);
    set({ selectedEntity: entity || null });
  },

  clearSelection: () => {
    set({ selectedEntity: null });
  },
}));
```

### Selector Pattern (Prevent Re-renders)

```typescript
// In components, use selectors:
const entities = useEntityStore((state) => state.entities);
const isLoading = useEntityStore((state) => state.isLoading);

// NOT:
const { entities, isLoading } = useEntityStore(); // ❌ Causes re-renders
```

### Deliverables

- [ ] Stores for all major data domains
- [ ] Loading and error states
- [ ] Selectors defined for components
- [ ] Persistence configured if needed

**Reference:** `STATE_MANAGEMENT_MANUAL.md`

---

## 8. Phase 6: UI Implementation

### Objective

Build React components that consume stores and render the designs.

### Component Structure

```
src/
├── app/
│   └── (admin)/
│       ├── layout.tsx
│       ├── orders/
│       │   ├── page.tsx              # Orders list page
│       │   └── [orderId]/page.tsx    # Single order page
│       └── events/
│           └── page.tsx              # Events list page
└── components/
    ├── ui/                           # shadcn primitives
    ├── common/                       # Shared components
    │   ├── Spinner.tsx
    │   └── BackButton.tsx
    └── admin/                        # Admin-specific
        ├── orders/
        │   ├── OrderTable.tsx
        │   └── OrderCard.tsx
        └── events/
            └── EventCard.tsx
```

### Page Component Pattern

```typescript
// src/app/(admin)/orders/page.tsx
'use client';

import { useEffect } from 'react';
import { useOrderStore } from '@/store/useOrderStore';
import { OrderTable } from '@/components/admin/orders/OrderTable';
import Spinner from '@/components/common/Spinner';

export default function OrdersPage() {
  const orders = useOrderStore((state) => state.orders);
  const isLoading = useOrderStore((state) => state.isLoading);
  const fetchOrders = useOrderStore((state) => state.fetchOrders);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-10">
      <div className="border-b-4 border-red-500 mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-center py-4">
          Orders List
        </h1>
      </div>

      <OrderTable orders={orders} />
    </div>
  );
}
```

### Deliverables

- [ ] All pages implemented
- [ ] Components match designs
- [ ] Responsive design verified
- [ ] Loading/empty/error states
- [ ] Accessibility basics (labels, focus)

**Reference:** `UI-UX-BUILDING-MANUAL.md`

---

## 9. Phase 7: Authentication & RBAC

### Objective

Add authentication and role-based access control to protect routes and features.

### Auth Implementation Checklist

- [ ] Login page(s) created
- [ ] Auth store configured
- [ ] Role flags defined in user_metadata
- [ ] Protected layouts with HOC
- [ ] API routes verify auth
- [ ] Role-based UI elements

### Route Protection

```typescript
// Layout-level protection
export default withRoleCheck(AdminLayout, {
  allowedRoles: ['is_admin', 'is_member'],
  redirectTo: '/login',
});
```

### API Protection

```typescript
// API route protection
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Deliverables

- [ ] Auth flows working (login, logout)
- [ ] Routes protected by role
- [ ] APIs protected by auth
- [ ] User management (if SuperAdmin)

**Reference:** `AUTH_MANUAL.md`

---

## 10. Phase 8: Integration & Testing

### Objective

Verify all components work together and meet acceptance criteria.

### Testing Checklist

#### Functional Testing

- [ ] All user stories verified against acceptance criteria
- [ ] Happy path flows work end-to-end
- [ ] Error states display correctly
- [ ] Edge cases handled (empty data, long text, etc.)

#### Auth Testing

- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Protected routes redirect unauthorized users
- [ ] Logout clears session completely
- [ ] Role-specific features visible only to correct roles

#### Data Testing

- [ ] CRUD operations work correctly
- [ ] Data persists after refresh
- [ ] Sync with external systems works
- [ ] Data validation prevents bad input

#### UI Testing

- [ ] Responsive design at all breakpoints
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Empty states display correctly

#### Performance Testing

- [ ] Pages load in < 3 seconds
- [ ] No unnecessary re-renders
- [ ] Large data sets paginate correctly

### Deliverables

- [ ] All acceptance criteria verified
- [ ] Bug fixes applied
- [ ] Performance acceptable

---

## 11. Phase 9: Deployment

### Objective

Deploy the application to production.

### Pre-Deployment Checklist

- [ ] Environment variables set in production
- [ ] Database migrations applied
- [ ] RLS policies enabled
- [ ] API keys secured (not in client code)
- [ ] Error logging configured
- [ ] Analytics configured (if needed)

### Deployment Steps

```bash
# 1. Build the application
npm run build

# 2. Test production build locally
npm run start

# 3. Deploy to Vercel/Netlify
# (Automatic via Git push or manual deploy)

# 4. Verify production
# - Check all pages load
# - Test login flow
# - Verify data displays
```

### Post-Deployment Checklist

- [ ] All pages accessible
- [ ] Auth works in production
- [ ] Database connections stable
- [ ] External integrations working
- [ ] Error monitoring active

---

## 12. Feature Spec Template

Use this template when starting any new feature:

```markdown
# Feature Spec: [Feature Name]

## Overview
[Brief description of the feature]

## User Stories
[List of user stories with acceptance criteria]

## Database Changes
[Tables, columns, relationships needed]

## API Endpoints
[New routes needed]

## State Management
[Stores to create or modify]

## UI Components
[Pages and components needed]

## Auth Requirements
[Roles that can access this feature]

## Dependencies
[Other features this depends on]

## Out of Scope
[What this feature does NOT include]

## Estimated Effort
- Phase 3 (Database): X hours
- Phase 4 (API): X hours
- Phase 5 (State): X hours
- Phase 6 (UI): X hours
- Phase 7 (Auth): X hours
- Phase 8 (Testing): X hours

## Risks & Considerations
[Known challenges or risks]
```

---

## 13. Checklists

### Feature Development Checklist

```markdown
## Feature: [Name]

### Phase 1: Planning
- [ ] User stories written
- [ ] Acceptance criteria defined
- [ ] Dependencies identified

### Phase 2: Design
- [ ] Screens designed
- [ ] Components identified
- [ ] Design spec documented

### Phase 3: Database
- [ ] Schema designed
- [ ] SQL written and run
- [ ] Types generated
- [ ] RLS policies applied

### Phase 4: API
- [ ] Services created
- [ ] API routes created
- [ ] Error handling added

### Phase 5: State
- [ ] Stores created
- [ ] Actions implemented
- [ ] Selectors defined

### Phase 6: UI
- [ ] Pages created
- [ ] Components built
- [ ] Responsive verified

### Phase 7: Auth
- [ ] Routes protected
- [ ] APIs protected
- [ ] Role-based UI working

### Phase 8: Testing
- [ ] Acceptance criteria verified
- [ ] Edge cases tested
- [ ] Bugs fixed

### Phase 9: Deployment
- [ ] Code merged
- [ ] Deployed to production
- [ ] Verified in production
```

### Code Review Checklist

```markdown
- [ ] Follows manual patterns
- [ ] TypeScript types correct
- [ ] Error handling present
- [ ] Loading states implemented
- [ ] No hardcoded values
- [ ] Environment variables used
- [ ] Console.logs removed (or intentional)
- [ ] No security issues (keys exposed, etc.)
```

### QA Checklist

```markdown
## Pre-Release QA

### Authentication
- [ ] Login works
- [ ] Logout works
- [ ] Session persists on refresh
- [ ] Protected routes redirect

### Data
- [ ] Create works
- [ ] Read works
- [ ] Update works
- [ ] Delete works

### UI
- [ ] Desktop layout correct
- [ ] Mobile layout correct
- [ ] Loading states show
- [ ] Error states show
- [ ] Empty states show

### Performance
- [ ] No slow pages
- [ ] No console errors
- [ ] No network errors
```

---

## 14. Manual Reference Guide

### When to Use Each Manual

| Manual | Use When |
|--------|----------|
| **UI-UX-BUILDING-MANUAL.md** | Building pages, components, layouts, styling |
| **AUTH_MANUAL.md** | Adding login, roles, protected routes, user management |
| **DATABASE_MANUAL.md** | Designing tables, writing SQL, managing data |
| **API_AND_SERVICES_MANUAL.md** | Creating services, API routes, webhooks, integrations |
| **STATE_MANAGEMENT_MANUAL.md** | Creating Zustand stores, managing client state |
| **APP_ARCHITECTURE_MANUAL.md** | Project structure, routing, rendering strategies |
| **ECOMMERCE_AND_PAYMENTS_MANUAL.md** | Stripe, cart logic, checkout flows |

### Quick Pattern Lookup

| Pattern | Manual | Section |
|---------|--------|---------|
| Page component | UI-UX | Page Building |
| Table component | UI-UX | Component Library |
| Auth flow | AUTH | Login Flow |
| RBAC | AUTH | Role-Based Access |
| SuperAdmin | AUTH | SuperAdmin User Management |
| DB schema | DATABASE | Schema Design Patterns |
| RLS | DATABASE | Row Level Security |
| JSONB | DATABASE | JSONB Patterns |
| Service layer | API | Service Layer |
| Webhook | API | Webhook Integration |
| CRM sync | API | CRM Integration |
| Zustand store | STATE | Store Architecture |
| Selectors | STATE | Selector Pattern |
| Persistence | STATE | Persistence |

---

## Summary

The Stark Software Factory Playbook ensures:

✅ **Predictable** - Same process for every feature  
✅ **Maintainable** - Code follows documented patterns  
✅ **Scalable** - Architecture supports growth  
✅ **Collaborative** - Human architects, AI builders, shared knowledge

**Remember:**
1. **Plan before you build**
2. **Schema before code**
3. **Follow the manuals**
4. **Test against acceptance criteria**
5. **Document as you go**

---

*This playbook is part of the Stark Industries Software Factory documentation suite.*

**Version:** 1.0  
**Last Updated:** December 2024
