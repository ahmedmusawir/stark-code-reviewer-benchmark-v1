# FRONTEND_FIRST_PLAYBOOK.md

> **Purpose:**
> This document defines **how and when we build UI before backend** in this engineering factory.
>
> It exists to maximize speed **without creating backend chaos later**.

This is a **global playbook**.
It applies to *all apps* built using this factory.

---

## 1. Why We Use a Frontend-First Approach

We build the frontend first because it allows us to:

* See the full user flow early
* Validate UX and navigation
* Catch missing features quickly
* Get stakeholder feedback before backend work
* Avoid expensive database rework

Frontend-first is **not** a shortcut.
It is a **deliberate product discovery phase**.

---

## 2. When Frontend-First Is Allowed

Frontend-first is allowed when:

* The app is internal or early-stage
* Business rules are still evolving
* UX clarity is more important than data optimization
* We want a working demo fast

Frontend-first is **not** allowed for:

* Financial ledgers
* Compliance-heavy systems
* Systems with irreversible data writes
* Highly regulated environments

---

## 3. Mandatory Gates Before UI Work Begins

Before writing UI code with mock data, **all of the following must exist**:

### Gate 1 — App Brief

A short document describing:

* what the app does
* who the users are
* what problem it solves

### Gate 2 — Data Contract (REQUIRED)

A data contract document must exist that defines:

* entities
* fields
* relationships
* enums
* audit fields

UI must not invent fields outside the data contract.

### Gate 3 — Service Layer Skeleton

A service layer must exist, even if:

* it returns hardcoded or mock data
* no backend exists yet

UI must **only** talk to the service layer.

---

## 4. Data Contract Rules

* Each app has its own data contract
* The data contract is app-specific
* Changes to UI that affect data shape **must update the data contract first**

If UI needs something not in the contract:

1. Update the contract
2. Update mock data
3. Update UI
4. Backend comes later

### Related Documents

* `CYBERBUGS_DATA_CONTRACT.md` — defines entities, fields, and relationships for CyberBugs
* Future apps will have their own `{APPNAME}_DATA_CONTRACT.md`

---

## 5. Service Layer Rules (Non-Negotiable)

* UI never fetches data directly
* UI never imports Supabase clients
* UI never talks to mock APIs directly

All data access goes through:

* service functions
* domain-named methods (e.g. `getBugs`, `createBug`)

The service layer acts as a **swap point**:

* mock implementation today
* real backend implementation later

### Service Layer Example

```typescript
// src/services/bugService.ts

import type { Bug } from '@/types';

// During Demo Mode: returns mock data
// During Production Mode: calls Supabase

export const bugService = {
  getAll: async (): Promise<Bug[]> => {
    // Mock implementation (swap later)
    const { bugs } = await import('@/mocks/data/bugs');
    return bugs;
  },

  getById: async (id: string): Promise<Bug | null> => {
    const { bugs } = await import('@/mocks/data/bugs');
    return bugs.find(b => b.id === id) || null;
  },

  create: async (bug: Omit<Bug, 'id' | 'created_at'>): Promise<Bug> => {
    // Mock: just return with fake id
    return { ...bug, id: `bug-${Date.now()}`, created_at: new Date().toISOString() };
  }
};
```

UI components call `bugService.getAll()` — they never know if it's mock or real.

---

## 6. Mock Data Strategy

Mock data exists to support UI development only.

### Allowed Mock Strategies (Ranked)

**Option 1 — In-code typed mocks (Preferred)**

* mock data as plain objects
* returned by service functions
* disposable and easy to remove

**Option 2 — Mock Service Worker (MSW)**

* intercepts API calls
* simulates real backend
* useful for realistic demos

**Option 3 — JSON Server (Use With Discipline)**

* allowed only behind service layer
* must mirror data contract exactly
* must be disposable

If mock infrastructure slows development, it must be removed.

### Mock File Location

All mock data lives in:

```
src/
└── mocks/
    ├── data/
    │   ├── apps.ts
    │   ├── bugs.ts
    │   ├── users.ts
    │   └── index.ts
    └── services/
        ├── appService.mock.ts
        ├── bugService.mock.ts
        └── userService.mock.ts
```

When transitioning to backend:

* Delete `src/mocks/` folder
* Update service imports to use real implementations

---

## 7. What Frontend-First Must Produce

A frontend-first phase should produce:

* Fully navigable UI
* Role-based access visible in UX
* Empty, loading, and error states
* Validated user flows
* Clear backend requirements

A successful frontend-first phase ends when:

* stakeholders agree on UX
* data needs are fully understood
* backend work is unblocked

---

## 8. Transition to Backend Phase

Once UI is approved:

* service layer implementation is swapped
* Supabase tables are created
* RLS policies are added
* mock data is removed
* UI remains unchanged

This is the **key success metric** of frontend-first:

> backend can be added without rewriting UI.

---

## 9. Common Failure Modes (Avoid These)

* Building UI without a data contract
* Fetching data directly in components
* Letting mock APIs become permanent
* Inventing fields during UI work
* Skipping service layer "because it's just a demo"

Frontend-first fails when discipline is lost.

---

## 10. Summary (Rules to Remember)

* Frontend-first is a **phase**, not a shortcut
* Data contract is mandatory
* Service layer is mandatory
* Mock data is temporary
* UI must survive backend replacement unchanged

---

## 11. Frontend-First Checklist

### Before Starting UI Work

- [ ] App Brief exists
- [ ] Data Contract exists and is reviewed
- [ ] Service layer skeleton created
- [ ] Mock data matches contract
- [ ] Types defined in `src/types/`

### Before Calling UI "Done"

- [ ] All pages navigable
- [ ] RBAC visible in UI (admin sees admin stuff, tester sees tester stuff)
- [ ] Loading states implemented
- [ ] Empty states implemented
- [ ] Error states implemented
- [ ] Stakeholder feedback collected
- [ ] Mobile responsiveness verified

### Before Transitioning to Backend

- [ ] Data Contract finalized (no more changes)
- [ ] Service layer ready for real implementation swap
- [ ] Mock data documented for removal
- [ ] All UI flows approved by stakeholders

---

## 12. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-01 | Initial playbook |

---

### END OF DOCUMENT

---