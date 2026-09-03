import { useId } from "react";
import { SidebarItem } from "@/components/layout/sidebar-item";
import { resolveHref } from "@/lib/nav-links";
import type { SidebarSection as SidebarSectionData } from "@/types/nav";

/*
 * One labelled group of nav items.
 *
 * The label is a `<p>`, not a heading: it sits before the page's own `<h1>` in
 * document order, and a heading here would break the descending order the a11y
 * rules ask for. `aria-labelledby` gives the list the same name a heading would
 * have, without entering the document outline.
 *
 * No "use client" — it is only ever imported by `SidebarNav`, which is already
 * a client leaf.
 */
export function SidebarSection({
  section,
  pathname,
  workspaceId,
}: {
  section: SidebarSectionData;
  pathname: string;
  workspaceId?: string;
}) {
  /* Not derived from `section.id`: the desktop <aside> stays mounted while the
     mobile drawer renders the same tree, so a static id would appear twice in
     the DOM whenever the drawer is open. useId() is unique per mounted copy. */
  const labelId = useId();

  return (
    <div className="mt-5">
      <p
        id={labelId}
        className="px-2 pb-1 text-2xs font-semibold tracking-widest text-text-subtle uppercase"
      >
        {section.label}
      </p>

      <ul aria-labelledby={labelId} className="space-y-0.5">
        {section.items.map((item) => {
          const href = resolveHref(item, workspaceId);
          return (
            <SidebarItem
              key={item.id}
              item={item}
              href={href}
              active={href === pathname}
            />
          );
        })}
      </ul>
    </div>
  );
}
