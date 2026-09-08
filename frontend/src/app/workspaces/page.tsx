import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WelcomeFireworks } from "@/components/layout/welcome-fireworks";
import { CreateWorkspaceButton } from "@/components/workspace/create-workspace-button";
import { WorkspaceGrid } from "@/components/workspace/workspace-grid";
import { WorkspaceList } from "@/components/workspace/workspace-list";
import { WorkspacesToolbar } from "@/components/workspace/workspaces-toolbar";
import { getSession } from "@/lib/auth";
import { getWorkspaces } from "@/lib/workspaces";
import { plural } from "@/lib/plural";
import { WELCOME_PARAM } from "@/lib/session-cookie";
import { parseArchivedFilter, parseWorkspaceView } from "@/lib/workspace-view";

export const metadata: Metadata = {
  title: "Workspaces",
  description: "Every workspace you belong to, and the projects inside them.",
};

/**
 * A Server Component. The shell around it comes from `workspaces/layout.tsx`;
 * this page renders page content only.
 *
 * `proxy.ts`'s guard is optimistic (cookie presence only) — this redirect is
 * the real check, same as `/board/[boardId]`.
 *
 * Both `?view=` and `?archived=` are read here rather than in a client toggle:
 * `archived` has to reach the fetch (the API omits archived rows unless asked
 * for them), and once one param is in the URL the other belongs there too.
 */
export default async function WorkspacesPage({ searchParams }: PageProps<"/workspaces">) {
  const user = await getSession();
  if (!user) redirect("/sign-in?next=/workspaces");

  const query = await searchParams;
  const view = parseWorkspaceView(query.view);
  const archived = parseArchivedFilter(query.archived);

  /* `includeArchived` returns archived AND active rows — the API has no
     archived-only filter — so the archived view narrows the result here. */
  const all = await getWorkspaces({ includeArchived: archived });
  const workspaces = archived ? all.filter((workspace) => workspace.isArchived) : all;

  return (
    <main className="w-full px-4 py-8 sm:px-6">
      {query[WELCOME_PARAM] === "1" && <WelcomeFireworks />}

      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-text">
            {archived ? "Archived workspaces" : "Workspaces"}
          </h1>
          <p className="mt-1.5 text-sm text-text-muted">
            {user.name} · {plural(workspaces.length, "workspace", "workspaces")}
          </p>
        </div>

        {/* The grid carries its own create tile; the list has nowhere to put
            one, and the archived view deliberately has neither. */}
        {view === "list" && !archived && <CreateWorkspaceButton />}
      </header>

      <WorkspacesToolbar view={view} archived={archived} />

      {view === "list" ? (
        <WorkspaceList workspaces={workspaces} archived={archived} />
      ) : (
        <WorkspaceGrid workspaces={workspaces} archived={archived} />
      )}
    </main>
  );
}
