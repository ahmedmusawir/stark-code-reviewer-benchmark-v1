import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

/**
 * QuickLaunchTile — Co-located tile for the home page's role-aware quick-launch grid.
 *
 * Born Phase 6, Run 001. Used only by HomePageContent — no other consumers.
 * If a second consumer emerges, promote to `src/components/common/`.
 *
 * Mobile-first: min-h-[112px] gives a comfortable tap target. The grid that
 * holds these tiles handles 1/2/3-column responsive layout.
 */

interface QuickLaunchTileProps {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}

const QuickLaunchTile = ({
  href,
  icon,
  title,
  description,
}: QuickLaunchTileProps) => {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 p-5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 hover:bg-white dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-500 transition-colors min-h-[112px]"
    >
      <div className="flex items-center justify-between">
        <div className="text-zinc-700 dark:text-zinc-300">{icon}</div>
        <ArrowUpRight
          size={16}
          className="text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors"
        />
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {title}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
};

export default QuickLaunchTile;
