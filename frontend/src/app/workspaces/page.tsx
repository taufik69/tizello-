import type { Metadata } from "next";
import { WorkspaceGrid } from "@/components/workspace/workspace-grid";
import { getCurrentUser, getWorkspaces } from "@/lib/demo-data";
import { plural } from "@/lib/plural";

export const metadata: Metadata = {
  title: "Workspaces",
  description: "Every workspace you belong to, and the projects inside them.",
};

/**
 * A Server Component. The shell around it comes from `workspaces/layout.tsx`;
 * this page renders page content only.
 */
export default async function WorkspacesPage() {
  const [workspaces, user] = await Promise.all([
    getWorkspaces(),
    getCurrentUser(),
  ]);

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
