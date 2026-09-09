import { useId } from "react";
import { useSidebarCollapsed } from "@/components/layout/sidebar-collapsed";
import { SidebarItem } from "@/components/layout/sidebar-item";
import { SidebarTreeItem } from "@/components/layout/sidebar-tree-item";
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
  const collapsed = useSidebarCollapsed();
  /* Not derived from `section.id`: the desktop <aside> stays mounted while the
     mobile drawer renders the same tree, so a static id would appear twice in
     the DOM whenever the drawer is open. useId() is unique per mounted copy. */
  const labelId = useId();

  return (
    <div className={collapsed ? "mt-3" : "mt-5"}>
      {/* Collapsed, the heading becomes a rule. The grouping is still worth
          drawing — it is what stops eighteen icons reading as one list — but a
          56px column has no room for "TIZELLO APPS", and truncating it to
          "TIZ…" names nothing. The list keeps the label as its accessible
          name, so a screen reader is told what a sighted user infers from the
          gap. */}
      {collapsed ? (
        <hr className="mx-2 mb-2 border-0 border-t border-border" />
      ) : (
        <p
          id={labelId}
          className="px-2 pb-1 text-2xs font-semibold tracking-widest text-text-subtle uppercase"
        >
          {section.label}
        </p>
      )}

      <ul
        aria-labelledby={collapsed ? undefined : labelId}
        aria-label={collapsed ? section.label : undefined}
        className="space-y-0.5"
      >
        {section.items.map((item) => {
          const href = resolveHref(item, workspaceId);
          const active = href === pathname;

          /* Sub-views only mean something once the parent has a destination
             to hang them off; without one the item is disabled anyway. And a
             disclosure needs somewhere to disclose to — collapsed, the group
             renders as the plain item it wraps, since its children are the
             same `?view=` links the page's own view strip already offers. */
          if (item.children && href && !collapsed) {
            return (
              <SidebarTreeItem
                key={item.id}
                item={item}
                href={href}
                active={active}
              />
            );
          }

          return (
            <SidebarItem
              key={item.id}
              item={item}
              href={href}
              active={active}
            />
          );
        })}
      </ul>
    </div>
  );
}
