import { AppRole } from "@/utils/get-user-role";
import { protectPage } from "@/utils/supabase/actions";

import AppShellPage from "@/components/common/AppShellPage";
import { CyberizeSidebar } from "@/components/layout/CyberizeSidebar";
import { ThemeToggle } from "@/components/global/ThemeToggle";

export default async function CyberizeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Any authenticated role can access the cyberize app surface.
  // The nested mission-control layout (Phase 7) will add an admin-only inner gate.
  await protectPage([AppRole.MEMBER, AppRole.ADMIN, AppRole.SUPERADMIN]);

  return (
    <AppShellPage
      sidebar={<CyberizeSidebar />}
      mobileTitle="CYBERIZE"
      mobileTopBarRight={<ThemeToggle />}
    >
      {children}
    </AppShellPage>
  );
}
