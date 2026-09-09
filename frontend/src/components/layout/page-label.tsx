"use client";

import { usePathname } from "next/navigation";
import { ProjectsIcon, SprintIcon } from "@/components/ui/nav-icons";
import { pageTitleFor } from "@/lib/page-title";

/**
 * The content strip's left-hand marker: page icon + page name.
 *
 * Deliberately NOT a breadcrumb. The trail lives in the content column, where
 * it is the page's own heading (`breadcrumb.tsx`); up here a second one would
 * be the same route drawn twice, a few pixels apart. This is orientation only —
 * which page am I on — so it is a `<p>`, not a `<nav>`, and nothing in it is a
 * link.
 */
export function PageLabel() {
  const pathname = usePathname();
  const Icon = pathname.startsWith("/board") ? SprintIcon : ProjectsIcon;

  return (
    <p className="flex min-w-0 items-center gap-1.5 text-sm text-text-muted">
      <Icon className="size-4 shrink-0" />
      <span className="min-w-0 truncate font-medium text-text">
        {pageTitleFor(pathname)}
      </span>
    </p>
  );
}
