"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { type ProjectFilters } from "@/lib/project-filters";
import { projectsHref } from "@/lib/project-view";
import type { ProjectView } from "@/types/project";

/**
 * "Change one filter and go there" — the one thing every toolbar control does.
 *
 * The CURRENT filters arrive as a prop from the Server Component that already
 * parsed them, rather than being read back out of `useSearchParams`. That is
 * deliberate: two parsers for one URL is two places for the fallback rules to
 * drift, and the server's copy is the one the data was actually fetched with.
 * A control that patched a client-side re-parse could disagree with the rows
 * on screen.
 *
 * `push`, not `replace`, so the back button walks back through the narrowing.
 * Someone who filters to "mine, on hold", clicks into a project and comes back
 * expects the filter still on; someone who filtered three times and wants out
 * expects Back to widen it a step at a time. `replace` would collapse both.
 *
 * `scroll: false` because none of these controls move the page — the rows
 * under the toolbar change, the toolbar does not. Jumping to the top on every
 * filter change loses the reader's place for no reason.
 */
export function useFilterNav({
  workspaceId,
  view,
  filters,
}: {
  workspaceId: string;
  view: ProjectView;
  filters: ProjectFilters;
}) {
  const router = useRouter();

  return useCallback(
    (patch: Partial<ProjectFilters>) => {
      router.push(projectsHref(workspaceId, view, { ...filters, ...patch }), {
        scroll: false,
      });
    },
    [router, workspaceId, view, filters],
  );
}
