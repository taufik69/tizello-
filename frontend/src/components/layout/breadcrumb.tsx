"use client";

import { usePathname } from "next/navigation";
import { ProjectsIcon, SprintIcon } from "@/components/ui/nav-icons";

/*
 * Known routes get the name the nav uses, so the strip and the sidebar cannot
 * disagree. A dynamic segment has no entry, and is humanised from the slug
 * instead — "atlas-robotics" reads as "Atlas Robotics" and stays correct
 * without threading the record's name down through the layout.
 */
const PAGE_LABELS: Record<string, string> = {
  "/workspaces": "Workspaces",
  "/board/backlog": "Backlog",
  "/board/sprint": "Sprint board",
};

function humanise(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/(^|\s)\S/g, (character) => character.toUpperCase());
}

/** The content strip's left-hand trail: page icon + page name. */
export function Breadcrumb() {
  const pathname = usePathname();
  const last = pathname.split("/").filter(Boolean).at(-1);
  const label = PAGE_LABELS[pathname] ?? (last ? humanise(last) : "Tizello");
  const Icon = pathname.startsWith("/board") ? SprintIcon : ProjectsIcon;

  return (
    <p className="flex min-w-0 items-center gap-1.5 text-sm text-text-muted">
      <Icon className="size-4 shrink-0" />
      <span className="min-w-0 truncate font-medium text-text">{label}</span>
    </p>
  );
}
