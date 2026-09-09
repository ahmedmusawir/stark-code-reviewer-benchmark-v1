"use client";

/**
 * AppShellPage — Full-bleed app surface primitive (sidebar + main column).
 *
 * ============================================================================
 * BORN FROM: Phase 5.4 of Stark Industries Factory Run 001
 *            (Cyberize Agentic Automation conversion, 2026-05-28).
 *            Operator decision: Option B in the "page composition for full-bleed
 *            app surfaces" discussion. See `agent_docs/STARTER_KIT_FEEDBACK.md`
 *            Lesson 7 for the full rationale and decision tree.
 * ============================================================================
 *
 * WHEN TO USE
 * ============
 * Use AppShellPage when the page is a full-bleed app surface:
 *   - Sidebar (left rail) with role-aware navigation or controls
 *   - Main column with its own scroll behavior (chat thread, dashboard panels)
 *   - Often a sticky input or action bar at the bottom of the main column
 *   - Examples: chat, mission control, ops dashboards, admin consoles
 *
 * DO NOT USE for content-flow pages (marketing, docs, lists, forms). Those
 * should use Page + Row + Box from `src/components/common/` which encode the
 * kit's content-flow layout conventions (responsive widths, padding rhythm).
 *
 * DECISION TREE (also in `STARTER_KIT_FEEDBACK.md` Lesson 7)
 * ==========================================================
 *   Is this a full-bleed app surface (sidebar + scrolling main)?
 *     YES → AppShellPage          (chat, mission control, dashboards)
 *     NO  → Is this content-flow (marketing, doc, form, list)?
 *             YES → Page + Row + Box     (home, demo, settings, forms)
 *             NO  → Is it a dense data table portal?
 *                     YES → plain <div className="container mx-auto p-6">
 *                           (matches admin-portal precedent — kit allows this)
 *
 * MOBILE-FIRST BEHAVIOR (NON-NEGOTIABLE — see Lesson 6)
 * ======================================================
 * < md (768px):
 *   - Sidebar HIDDEN by default
 *   - Slide-over drawer triggered by hamburger button in the mobile top bar
 *   - Backdrop overlay; tap outside or press Escape to close
 *   - Body scroll-locked while drawer is open
 *   - Hamburger button is ≥ 44×44 (touch target per HIG / Material)
 *   - Thin (h-12) top bar shows hamburger + `mobileTitle` wordmark + right slot
 *
 * ≥ md:
 *   - Sidebar persistently visible at the width its component renders (typically w-64)
 *   - No mobile top bar
 *   - Main column fills remaining width
 *
 * THEME (light / dark)
 * ====================
 * - Light: `bg-white` / `text-zinc-900`
 * - Dark:  `bg-zinc-800` / `text-zinc-100`
 *   (Note: zinc-800, not zinc-950 — softer dark per Operator feedback. Closer
 *    to ChatGPT's actual dark palette. The sidebar typically takes a slightly
 *    darker tint in dark mode for differentiation, e.g., `bg-zinc-900`.)
 *
 * USAGE EXAMPLE
 * =============
 *   import AppShellPage from "@/components/common/AppShellPage";
 *   import { CyberizeSidebar } from "@/components/layout/CyberizeSidebar";
 *   import { ThemeToggle } from "@/components/global/ThemeToggle";
 *
 *   export default async function CyberizeLayout({ children }) {
 *     await protectPage([AppRole.MEMBER, AppRole.ADMIN, AppRole.SUPERADMIN]);
 *
 *     return (
 *       <AppShellPage
 *         sidebar={<CyberizeSidebar />}
 *         mobileTitle="CYBERIZE"
 *         mobileTopBarRight={<ThemeToggle />}
 *       >
 *         {children}
 *       </AppShellPage>
 *     );
 *   }
 *
 * Children typically manage their own flex layout:
 *   <div className="flex flex-col h-full">
 *     <MessageList />
 *     <ChatInput />
 *   </div>
 *
 * ACCESSIBILITY
 * =============
 * - Hamburger button has `aria-label="Open navigation menu"`
 * - Close button has `aria-label="Close navigation menu"` and is positioned
 *   inside the drawer (top-right)
 * - Mobile drawer has `role="dialog"` + `aria-modal="true"` + `aria-label`
 * - Escape key closes the drawer
 * - Tap-outside (backdrop click) closes the drawer
 *
 * INTENTIONAL OMISSIONS (v1)
 * ==========================
 * - Right rail / second sidebar — not needed yet; add when a screen needs it
 * - Top bar on desktop — sidebars own their own headers; add later if shared
 *   global controls (search, notifications, account menu) become a thing
 * - Focus trap on open drawer — Phase 7 polish if accessibility audit flags it
 * - Sticky breadcrumb — children render their own if needed
 *
 * SHARED-STATE NOTE
 * =================
 * `sidebar` is rendered TWICE: once in the desktop persistent slot and once
 * in the mobile drawer. Both render the SAME React element type, so each
 * instantiates its own component. Any local component state (useState) is
 * duplicated across the two instances; Zustand-backed state syncs naturally
 * because the store is a singleton. Keep sidebar components store-driven if
 * they need cross-instance state.
 *
 * PROMOTION PATH
 * ==============
 * If this primitive succeeds across:
 *   - Phase 5 chat (Run 001 — first consumer)
 *   - Phase 6 home (Run 001 — TBD; might use Page+Row+Box instead)
 *   - Phase 7 mission control (Run 001 — second consumer, confirms generalization)
 *
 * Then at the Phase 8 Retrospective, promote upstream to:
 *   - `agent_docs/APP_FACTORY/UI-UX-BUILDING-MANUAL.md` §Page Building Pattern
 *     (new sub-section "AppShellPage: full-bleed app surfaces")
 *   - The pristine starter kit baseline (kit ships `src/components/common/AppShellPage.tsx`)
 *   - The Factory module playbook (06-CHAT.md and 07-MISSION-CONTROL.md
 *     reference AppShellPage as the canonical wrapper for app-shell pages)
 *
 * EVOLUTION
 * =========
 * If you (future agent) hit a use case this primitive doesn't fit, DO NOT
 * fork it or hack around it. Surface to the operator: propose either an
 * extension (new prop / slot) or a sibling primitive (e.g., `AppShellPageWithRail`
 * for right-rail layouts). The operator decides whether to extend, branch,
 * or compose. Don't drift silently.
 */

import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

interface AppShellPageProps {
  /** Sidebar content — rendered persistently on desktop, in a slide-over drawer on mobile */
  sidebar: ReactNode;
  /** Main column content — manages its own flex layout (e.g., `<div className="flex flex-col h-full">`) */
  children: ReactNode;
  /** Wordmark/title shown in the mobile top bar next to the hamburger. Hidden on desktop. */
  mobileTitle?: string;
  /** Optional slot on the right side of the mobile top bar (e.g., a `<ThemeToggle />`). Hidden on desktop. */
  mobileTopBarRight?: ReactNode;
}

export default function AppShellPage({
  sidebar,
  children,
  mobileTitle,
  mobileTopBarRight,
}: AppShellPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close drawer on Escape
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (sidebarOpen) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [sidebarOpen]);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100">
      {/* Mobile top bar (< md) */}
      <div className="md:hidden flex items-center justify-between h-12 px-2 border-b border-zinc-200 dark:border-zinc-600 shrink-0">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
          className="min-h-11 min-w-11 flex items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-600/60 transition-colors"
        >
          <Menu size={20} />
        </button>
        {mobileTitle && (
          <p className="text-xs font-medium tracking-[0.2em] text-zinc-900 dark:text-zinc-50">
            {mobileTitle}
          </p>
        )}
        <div className="min-w-11 flex justify-end">
          {mobileTopBarRight ?? <div className="w-9 h-9" />}
        </div>
      </div>

      {/* Main row: sidebar (desktop) + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop persistent sidebar */}
        <div className="hidden md:flex shrink-0">{sidebar}</div>

        {/* Mobile slide-over drawer */}
        <div className="md:hidden">
          {/* Backdrop */}
          <div
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
            className={
              "fixed inset-0 z-40 bg-black/50 transition-opacity " +
              (sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none")
            }
          />
          {/* Drawer */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className={
              "fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-200 ease-out " +
              (sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full pointer-events-none")
            }
          >
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation menu"
              className="absolute top-2 right-2 z-10 min-h-11 min-w-11 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-600/60 transition-colors"
            >
              <X size={20} />
            </button>
            {sidebar}
          </div>
        </div>

        {/* Main content column */}
        <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
