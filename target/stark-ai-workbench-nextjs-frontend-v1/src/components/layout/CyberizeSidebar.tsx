"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, SlidersHorizontal } from "lucide-react";

import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/chatStore";
import { AppRole } from "@/utils/app-role";
import { ThemeToggle } from "@/components/global/ThemeToggle";
import { AgentSwitcher } from "@/components/chat/AgentSwitcher";
import { SessionPanel } from "@/components/chat/SessionPanel";

export const CyberizeSidebar = () => {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const resetChat = useChatStore((s) => s.reset);
  const router = useRouter();
  const pathname = usePathname();

  const userEmail =
    user && typeof user === "object" && "email" in user
      ? String((user as { email: unknown }).email ?? "")
      : "";

  const isAdminPlus = role === AppRole.ADMIN || role === AppRole.SUPERADMIN;
  const isOnMC = pathname.startsWith("/mission-control");

  const handleLogout = async () => {
    await logout().catch(() => {
      // swallow — still redirect for clean UX
    });
    resetChat();
    router.push("/auth");
  };

  return (
    <aside className="w-64 shrink-0 flex flex-col bg-zinc-50 dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-600 h-full">
      <Link
        href="/"
        className="block px-4 py-5 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors"
        aria-label="Go to home"
        title="Home"
      >
        <p className="text-xs font-medium tracking-[0.2em] text-zinc-900 dark:text-zinc-50">
          CYBERIZE
        </p>
      </Link>

      {isAdminPlus && (
        <div className="px-3 pb-2">
          <Link
            href="/mission-control"
            className={
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors min-h-11 " +
              (isOnMC
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/60")
            }
          >
            <SlidersHorizontal size={16} />
            <span>Mission Control</span>
          </Link>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <AgentSwitcher />
        {/* BIM-004: the selected agent's conversation list (Projects UX) */}
        <SessionPanel />
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-600 p-3 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          {userEmail && (
            <p
              className="text-xs text-zinc-500 dark:text-zinc-400 truncate"
              title={userEmail}
            >
              {userEmail}
            </p>
          )}
        </div>
        <ThemeToggle />
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sign out"
          className="min-h-11 min-w-11 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-700 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};
