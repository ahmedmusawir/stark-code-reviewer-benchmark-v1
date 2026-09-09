import { ReactNode } from "react";
import Navbar from "@/components/global/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { protectPage } from "@/utils/supabase/actions";
import { AppRole } from "@/utils/get-user-role";

interface LayoutProps {
  children: ReactNode;
}

export default async function MemberLayout({ children }: LayoutProps) {
  await protectPage([AppRole.MEMBER]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <section className="flex flex-1">
        <div className="hidden md:block h-auto flex-shrink-0 border-4 w-[25rem]">
          <Sidebar />
        </div>
        <div className="flex-grow">{children}</div>
      </section>
    </div>
  );
}
