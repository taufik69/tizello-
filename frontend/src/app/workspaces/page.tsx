import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspaceGrid } from "@/components/workspace/workspace-grid";
import { getSession } from "@/lib/auth";
import { getWorkspaces } from "@/lib/workspaces";
import { plural } from "@/lib/plural";

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
 */
export default async function WorkspacesPage() {
  const user = await getSession();
  if (!user) redirect("/sign-in?next=/workspaces");

  const workspaces = await getWorkspaces();

  return (
    <main className="w-full px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-text">
            Workspaces
          </h1>
          <p className="mt-1.5 text-sm text-text-muted">
            {user.name} · {plural(workspaces.length, "workspace", "workspaces")}
          </p>
        </header>

      <WorkspaceGrid workspaces={workspaces} />
    </main>
  );
}
