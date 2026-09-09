import { ReactNode } from "react";
import Navbar from "@/components/global/Navbar";
import SuperadminSidebar from "@/components/layout/SuperadminSidebar";
import { protectPage } from "@/utils/supabase/actions";
import { AppRole } from "@/utils/get-user-role";

interface LayoutProps {
  children: ReactNode;
}

export default async function SuperAdminLayout({ children }: LayoutProps) {
  await protectPage([AppRole.SUPERADMIN]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <section className="flex flex-1">
        <div className="hidden md:block h-auto flex-shrink-0 border-4 w-[25rem]">
          <SuperadminSidebar />
        </div>
        <div className="flex-grow">{children}</div>
      </section>
    </div>
  );
}
