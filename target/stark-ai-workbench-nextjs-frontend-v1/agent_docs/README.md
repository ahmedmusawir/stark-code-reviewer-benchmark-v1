# CyberBugs Documentation Index

This directory contains all documentation for the CyberBugs project, organized into factory-level playbooks and app-specific documentation.

---

## 📁 Directory Structure

```
/docs
├── /factory/                   # Global playbooks (apply to ALL apps)
├── /cyberbugs/                 # CyberBugs app-specific docs
│   └── /sessions/              # Session logs
└── README.md                   # This file
```

---

## 🏭 Factory Documentation (`/factory/`)

These are **universal playbooks and manuals** that apply to all projects built with the Stark Software Factory methodology.

### Core Playbooks
- **[SOFTWARE_FACTORY_PLAYBOOK.md](./factory/SOFTWARE_FACTORY_PLAYBOOK.md)**  
  Master playbook defining the Stark Software Factory methodology and workflow

- **[FRONTEND_FIRST_PLAYBOOK.md](./factory/FRONTEND_FIRST_PLAYBOOK.md)**  
  When and why to use frontend-first development approach

- **[FRONTEND_BUILD_PHASE_PLAYBOOK.md](./factory/FRONTEND_BUILD_PHASE_PLAYBOOK.md)**  
  6-stage sequential process for UI-first development with mock data

### Technical Manuals
- **[AUTH_MANUAL.md](./factory/AUTH_MANUAL.md)**  
  Authentication and authorization implementation guide (Supabase Auth)

- **[DATABASE_MANUAL.md](./factory/DATABASE_MANUAL.md)**  
  Database design, migrations, RLS policies, and best practices

- **[APP_ARCHITECTURE_MANUAL.md](./factory/APP_ARCHITECTURE_MANUAL.md)**  
  Application architecture patterns, folder structure, and conventions

- **[UI-UX-BUILDING-MANUAL.md](./factory/UI-UX-BUILDING-MANUAL.md)**  
  UI/UX component patterns, design system, and accessibility guidelines

- **[API_AND_SERVICES_MANUAL.md](./factory/API_AND_SERVICES_MANUAL.md)**  
  API design, service layer patterns, and integration strategies

- **[STATE_MANAGEMENT_MANUAL.md](./factory/STATE_MANAGEMENT_MANUAL.md)**  
  State management patterns, context usage, and data flow

- **[ECOMMERCE_AND_PAYMENTS_MANUAL.md](./factory/ECOMMERCE_AND_PAYMENTS_MANUAL.md)**  
  E-commerce patterns, payment integration, and transaction handling

---

## 🐛 CyberBugs Documentation (`/cyberbugs/`)

App-specific documentation for the CyberBugs bug tracking application.

### Core Documents
- **[CYBERBUGS_DATA_CONTRACT.md](./cyberbugs/CYBERBUGS_DATA_CONTRACT.md)**  
  Entity definitions, field specifications, and relationships (frontend-backend contract)

- **[STARTER_PROJECT_OVERVIEW.md](./cyberbugs/STARTER_PROJECT_OVERVIEW.md)**  
  Project overview, tech stack, and initial setup documentation

### Session Logs (`/cyberbugs/sessions/`)
Chronological development session logs documenting progress, decisions, and changes.

- **[SESSION_30DEC2025.md](./cyberbugs/sessions/SESSION_30DEC2025.md)**  
  Initial project setup and foundation

- **[SESSION_01JAN2026.md](./cyberbugs/sessions/SESSION_01JAN2026.md)**  
  Phase 0: Demo Mode - Types, mock data, service layer, app shell

- **[SESSION_02JAN2026.md](./cyberbugs/sessions/SESSION_02JAN2026.md)**  
  Stage 3 Polish: Loading/error states, toast system, confirmation dialogs

---

## 🎯 Quick Reference

### For New Developers
1. Start with **SOFTWARE_FACTORY_PLAYBOOK.md** to understand the methodology
2. Read **FRONTEND_BUILD_PHASE_PLAYBOOK.md** to understand the 6-stage process
3. Review **CYBERBUGS_DATA_CONTRACT.md** to understand the data model
4. Check latest session log to see current progress

### For Resuming Work
1. Read the latest session log in `/cyberbugs/sessions/`
2. Check the "Resume Instructions" section
3. Verify current stage in Frontend Build Phase
4. Continue from the documented resume point

### For Architecture Decisions
- **Auth questions** → `AUTH_MANUAL.md`
- **Database questions** → `DATABASE_MANUAL.md`
- **UI patterns** → `UI-UX-BUILDING-MANUAL.md`
- **API design** → `API_AND_SERVICES_MANUAL.md`
- **State management** → `STATE_MANAGEMENT_MANUAL.md`

---

## 📋 Current Project Status

**Current Stage**: Stages 3, 4 & 5 (✅ 100% COMPLETE) | Stage 6 Demo Prep (FINAL!)
**Last Updated**: 02 JAN 2026 (Epic Friday Night Session!)
**Next Steps**: Stage 6 - Test flows, remove debug code, document limitations

See **[SESSION_02JAN2026.md](./cyberbugs/sessions/SESSION_02JAN2026.md)** for detailed status.

---

## 🔄 Document Maintenance

- Session logs are created after each significant work session
- Factory playbooks are updated when methodology evolves
- Data Contract is updated when entity requirements change
- This README is updated when documentation structure changes

---

**Last Updated**: 02 JAN 2026
