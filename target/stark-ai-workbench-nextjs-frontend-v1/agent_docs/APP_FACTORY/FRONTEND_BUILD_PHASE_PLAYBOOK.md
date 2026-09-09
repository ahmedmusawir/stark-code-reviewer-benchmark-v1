# FRONTEND_BUILD_PHASE_PLAYBOOK.md

 Purpose
 This document defines how the Frontend Build Phase is executed in this factory.

 It exists to ensure

  UI-first work is disciplined
  demo data does not become a fake backend
  all apps reach a usable, reviewable demo state before backend work begins

 This is a global playbook.
 It applies to all frontend-first builds unless an alternative strategy is explicitly chosen.

---

## 1. Position in the Factory

This playbook is used when

 Frontend-First has been selected as the execution strategy
 A Data Contract already exists for the app
 Backend implementation is intentionally deferred

This playbook does not decide whether frontend-first is used.
It defines how to execute it correctly once chosen.

Related Documents
 `FRONTEND_FIRST_PLAYBOOK.md` — Defines when and why to use frontend-first
 `{APPNAME}_DATA_CONTRACT.md` — Defines the data shape for the specific app

---

## 2. Frontend Build Phase — Overview

The Frontend Build Phase is broken into six ordered stages.

Each stage has

 a clear goal
 defined outputs
 explicit stop conditions

Stages must be completed in order.

```
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND BUILD PHASE                       │
├─────────────────────────────────────────────────────────────┤
│  Stage 1 Layout & Navigation Skeleton                      │
│      ↓                                                      │
│  Stage 2 Page Fidelity Pass (Design Alignment)             │
│      ↓                                                      │
│  Stage 3 UX Polish Pass (Manual Refinement)                │
│      ↓                                                      │
│  Stage 4 Subpages & Edge Screens                           │
│      ↓                                                      │
│  Stage 5 UI-Complete Functionality (Mock-Driven)           │
│      ↓                                                      │
│  Stage 6 Demo Deployment Prep (V1)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Stage 1 — Layout & Navigation Skeleton

### Goal

Create the structural shell of the application.

No functionality. No real data behavior.

### Activities

 Implement global layout (sidebar, header, footer)
 Set up route groups (member  admin  superadmin)
 Create main pages from design (placeholders allowed)
 Add navigation links
 Add access-denied and not-found pages
 Verify RBAC redirects work

### Rules

 No business logic
 No service calls
 No mock data beyond placeholders

### Output

 Clickable navigation
 All primary routes exist
 Pages render without errors

### Stop Condition

You can navigate the entire app without hitting missing routes.

---

## 4. Stage 2 — Page Fidelity Pass (Design Alignment)

### Goal

Make pages visually match the approved design.

### Activities

 Implement Page  Row  Box layout consistently
 Build tables, cards, forms based on design
 Ensure responsive behavior is acceptable
 Replace placeholders with real UI components
 Reference Stitch designs (or equivalent) for layout

### Rules

 Still no real functionality
 Focus is visual structure, not behavior

### Output

 Pages visually resemble final product
 Layout feels consistent across the app

### Stop Condition

Design feedback is about details, not structure.

---

## 5. Stage 3 — UX Polish Pass (Manual Refinement)

### Goal

Make the app feel professional and intentional.

This stage includes manual human judgment. AI output is corrected and refined.

### Activities

 Fix spacing inconsistencies
 Improve typography hierarchy
 Normalize button styles and variants
 Add loading states
 Add empty states
 Add error states
 Add confirmation dialogs and toasts
 Improve form validation messaging
 Fix breadcrumbs (if applicable)
 Update documentation if Cascade deviated from standards

### Rules

 This is a human-driven stage
 Do not skip — AI misses polish details

### Output

 App feels usable even without real data
 No obvious rough edges in common flows

### Stop Condition

A user can navigate without confusion or friction.

---

## 6. Stage 4 — Subpages & Edge Screens

### Goal

Eliminate unfinished app gaps.

### Activities

 Detail pages (view single item)
 Edit pages (edit single item)
 Create pages (new item forms)
 Settings pages
 Profile pages
 Error screens (404, 500, access denied)
 Empty state screens
 Breadcrumb implementation (decision must be recorded)

### Rules

 No new primary features introduced here
 This stage completes navigation coverage

### Output

 All navigation paths terminate cleanly
 No dead buttons or placeholder routes

### Stop Condition

Every link leads to a real screen.

---

## 7. Stage 5 — UI-Complete Functionality (Mock-Driven)

### Goal

Validate user flows, not backend realism.

This stage makes the app feel usable using demo data.

---

### Allowed Functionality (UI Phase)

 Feature  Notes 
----------------
 Create items  In-memory only, lost on refresh 
 Edit items  In-memory only 
 Delete items  In-memory only 
 Change statusseverity  In-memory only 
 Filters  Client-side filtering of mock data 
 Search  Client-side search of mock data 
 Sorting  Client-side sorting 
 Pagination  Client-side (service returns paginated results) 
 Role-based UI gating  Hideshow actions based on role 
 Form validation  Client-side validation 
 Successerror toasts  Feedback for user actions 

---

### Explicitly Forbidden (Backend Phase Only)

 Feature  Why 
--------------
 localStorage persistence  Adds complexity, no real value for demo 
 Real concurrency simulation  Backend concern 
 Audithistory systems  Backend concern 
 File uploads to storage  Backend concern (show UI only) 
 Background jobs  Backend concern 
 WebSockets  real-time sync  Backend concern 
 Multi-user permission enforcement  RLS concern 
 DB-level pagination logic  Backend concern 
 Data integrity enforcement  Backend concern 
 Fake auth or fake permissions  Use real auth with mock data 

---

### Mock Discipline Rules (Non-Negotiable)

 UI never talks directly to mock data files
 All data access goes through the service layer
 Mock data must follow the Data Contract exactly
 Mock behavior must be deterministic (same input = same output)
 No fake auth or fake permissions systems — use real auth
 If mocking becomes complex → simplify or stop

---

### The Golden Rule

 Demo data exists to prove the UI works. It should be simple enough to delete entirely when backend is ready.

 If you find yourself debugging mock data logic or building complex state management for mocks — STOP. You've gone too far. Simplify.

---

### Output

 End-to-end flows work with demo data
 Stakeholders can use the app
 UI reveals missing requirements clearly

### Stop Condition

When further realism would require backend logic.

---

## 8. Stage 6 — Demo Deployment Prep (V1)

### Goal

Produce a stable, reviewable demo environment.

### Activities

 Seed demo data (representative, not exhaustive)
 Verify RBAC behavior (app-layer redirects)
 Test all user flows end-to-end
 Fix broken flows
 Remove debug UI and console logs
 Document known limitations (e.g., data resets on refresh, RLS not implemented yet)
 Deploy to staging (Vercel or equivalent)

### Rules

 This is not production
 Stability matters more than completeness
 Communicate limitations clearly to stakeholders

### Output

 Deployed demo app at staging URL
 Stakeholders can review and give feedback
 UI requirements are effectively frozen

### Stop Condition

Feedback shifts from UX changes to datasecurity concerns.

---

## 9. UI Phase Completion Checklist

Before declaring Frontend Build Phase complete

### Navigation & Structure
- [ ] All routes exist and render
- [ ] No dead links or placeholder buttons
- [ ] Breadcrumb decision recorded (implemented or intentionally skipped)

### States & Feedback
- [ ] Loading states implemented
- [ ] Empty states implemented
- [ ] Error states implemented
- [ ] Toast notifications working
- [ ] Form validation messages showing

### Access Control
- [ ] Role-based access verified visually
- [ ] Admin sees admin pages only
- [ ] Member sees member pages only
- [ ] Unauthorized access redirects correctly

### Functionality
- [ ] Core flows work end-to-end with demo data
- [ ] Pagination UI exists where lists are large
- [ ] Filters work (if applicable)
- [ ] Search works (if applicable)

### Documentation
- [ ] Known backend dependencies documented
- [ ] Known limitations documented
- [ ] Data Contract still accurate (update if UI revealed new needs)

If any item is unchecked, the phase is not complete.

---

## 10. Things That Should Just Work

These components should be built into every app by default. If Cascade misses any, flag it in Stage 3 (Polish).

 Component  Purpose 
--------------------
 Pagination component  Reusable across all tables 
 Breadcrumbs  Auto-generated from route (if decided yes) 
 Loading spinner  Global and inline variants 
 Empty state component  Reusable No data message 
 Error boundary  Catches React errors gracefully 
 Toast notifications  Successerror feedback 
 Mobile responsive nav  Sidebar collapses on mobile 
 Dark mode toggle  Respects system preference 
 Confirmation dialog  Are you sure for destructive actions 

---

## 11. Transition to Backend Phase

The Frontend Build Phase ends when

 UI flows are validated
 Data requirements are clear
 Demo feedback is incorporated
 Backend work is unblocked and justified

Backend implementation should begin only after this point.

The next phase will
 Create Supabase tables from Data Contract
 Implement RLS policies
 Swap mock services for real services
 Enable file uploads via Supabase Storage
 Deploy to production

---

## 12. Version History

 Version  Date  Changes 
------------------------
 1.0  2026-01-02  Initial playbook 

---

### END OF DOCUMENT