import Link from "next/link";
import {
  LayoutDashboard,
  LogIn,
  MessageSquare,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  User,
  type LucideIcon,
} from "lucide-react";

import Page from "@/components/common/Page";
import Row from "@/components/common/Row";
import Box from "@/components/common/Box";
import { AppRole } from "@/utils/get-user-role";

import QuickLaunchTile from "./QuickLaunchTile";

interface HomePageContentProps {
  userEmail: string | null;
  role: AppRole | null;
}

interface TileSpec {
  href: string;
  Icon: LucideIcon;
  title: string;
  description: string;
}

const getTilesForRole = (role: AppRole | null): TileSpec[] => {
  if (!role) return [];
  const tiles: TileSpec[] = [];

  // All authenticated roles — Chat is the primary surface
  tiles.push({
    href: "/chat",
    Icon: MessageSquare,
    title: "Chat",
    description: "Converse with the agent fleet.",
  });

  // Admin+ tools
  if (role === AppRole.ADMIN || role === AppRole.SUPERADMIN) {
    tiles.push({
      href: "/mission-control",
      Icon: SlidersHorizontal,
      title: "Mission Control",
      description: "Edit per-agent instructions.",
    });
    tiles.push({
      href: "/admin-portal",
      Icon: Shield,
      title: "Admin Portal",
      description: "Manage members and roles.",
    });
  }

  // Superadmin-only
  if (role === AppRole.SUPERADMIN) {
    tiles.push({
      href: "/superadmin-portal",
      Icon: ShieldCheck,
      title: "Superadmin Portal",
      description: "Full user administration.",
    });
  }

  // Member-primary
  if (role === AppRole.MEMBER) {
    tiles.push({
      href: "/members-portal",
      Icon: LayoutDashboard,
      title: "Members Dashboard",
      description: "Your member portal.",
    });
  }

  // Profile for everyone — destination depends on role per kit convention
  const profileHref =
    role === AppRole.MEMBER ? "/members-portal/profile" : "/profile";
  tiles.push({
    href: profileHref,
    Icon: User,
    title: "Profile",
    description: "Update your account details.",
  });

  return tiles;
};

const HomePageContent = ({ userEmail, role }: HomePageContentProps) => {
  const isAuthed = !!role;
  const tiles = getTilesForRole(role);

  return (
    <Page FULL={false} className="">
      {/* Hero */}
      <Row className="text-center pt-6 md:pt-12">
        <p className="text-xs font-medium tracking-[0.25em] text-zinc-500 dark:text-zinc-400 mb-3">
          CYBERIZE
        </p>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Cyberize Agentic Automation
        </h1>
        <p className="text-base md:text-lg text-zinc-500 dark:text-zinc-400 mt-3">
          Operate. Configure. Converse.
        </p>
        <div className="mt-5">
          <SystemStatusPill />
        </div>
      </Row>

      {/* Authed: role-aware quick-launch tiles. Unauthed: sign-in CTA. */}
      {isAuthed ? (
        <Row className="pt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
            Quick launch
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tiles.map((tile) => (
              <QuickLaunchTile
                key={tile.href}
                href={tile.href}
                icon={<tile.Icon size={20} />}
                title={tile.title}
                description={tile.description}
              />
            ))}
          </div>
        </Row>
      ) : (
        <Row className="flex flex-col items-center pt-6">
          <Box className="w-full max-w-md text-center">
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-md font-medium bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
            >
              <LogIn size={18} />
              Sign in
            </Link>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3">
              Need access? Contact your administrator.
            </p>
          </Box>
        </Row>
      )}

      {/* Footer */}
      <Row className="pt-8 pb-4 text-center">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Cyberize &middot; Stark Industries Internal
          {userEmail && (
            <>
              {" "}
              &middot; signed in as <span className="text-zinc-500 dark:text-zinc-400">{userEmail}</span>
            </>
          )}
        </p>
      </Row>
    </Page>
  );
};

export default HomePageContent;

/* ───────────────────────────── System status pill (mocked) ───────────────────────────── */

const SystemStatusPill = () => (
  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
    <span className="relative flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
    </span>
    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
      All systems operational
    </span>
  </div>
);
