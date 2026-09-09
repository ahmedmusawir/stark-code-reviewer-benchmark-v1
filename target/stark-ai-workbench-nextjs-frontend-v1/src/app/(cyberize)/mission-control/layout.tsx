import { AppRole } from "@/utils/get-user-role";
import { protectPage } from "@/utils/supabase/actions";

export default async function MissionControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Admin+ only. Members hitting this route get redirected to /auth by protectPage.
  // Inherits from (cyberize)/layout.tsx which provides the app shell + first auth gate.
  await protectPage([AppRole.ADMIN, AppRole.SUPERADMIN]);
  return <>{children}</>;
}
