/**
 * AppRole enum — extracted to its own server-free module so client components
 * can import it as a runtime value without dragging server-only modules
 * (next/headers, supabase/server) into the client bundle.
 *
 * Why this file exists: the kit's `get-user-role.ts` co-located the enum AND
 * the `getUserRole` server function. When a client component imports the
 * enum as a value (e.g., `role === AppRole.ADMIN`), the entire module loads,
 * pulling `next/headers` (server-only) into the client bundle and breaking
 * `next build`.
 *
 * Born Phase 6 hotfix, Run 001 (2026-05-29). See STARTER_KIT_FEEDBACK.md
 * Lesson 8 for the cross-project rule.
 */

export enum AppRole {
  SUPERADMIN = "superadmin",
  ADMIN = "admin",
  MEMBER = "member",
}
