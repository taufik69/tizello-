import Link from "next/link";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleBadge } from "@/components/workspace/role-badge";
import { WorkspaceAvatar } from "@/components/workspace/workspace-avatar";
import { plural } from "@/lib/plural";
import type { Workspace } from "@/types/workspace";

/**
 * A whole card is one link target, so the hover lift lives on the `<a>` and the
 * `Card` inside follows it. That also puts the focus ring around the card
 * rather than around a word in the middle of it.
 *
 * `memberCount` / `projects` are fixture-only (see types/workspace.ts) — a
 * real, API-sourced workspace has neither, so the footer falls back to the
 * slug rather than rendering "undefined projects".
 */
export function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const { id, name, slug, icon, color, memberCount, role, accent, projects, isArchived } = workspace;
  const tasks = projects?.reduce((total, project) => total + project.taskCount, 0);

  return (
    <Link
      href={`/workspaces/${id}`}
      className="group block h-full rounded-md transition-transform duration-100 ease-standard hover:-translate-y-0.5"
    >
      <Card className="h-full transition-shadow duration-100 ease-standard group-hover:shadow-raised">
        <CardHeader className="gap-3">
          <div className="flex items-start gap-3">
            <WorkspaceAvatar name={name} icon={icon} color={color} accent={accent} />

            <div className="min-w-0 flex-1">
              <CardTitle className="line-clamp-2 break-words">{name}</CardTitle>
              <p className="mt-0.5 truncate text-2xs text-text-subtle">
                {memberCount !== undefined ? plural(memberCount, "member", "members") : `@${slug}`}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1">
              {isArchived && (
                <span className="rounded-xs bg-surface-sunken px-1.5 py-0.5 text-2xs font-medium text-text-subtle">
                  Archived
                </span>
              )}
              {role === "OWNER" && <RoleBadge role={role} />}
            </div>
          </div>
        </CardHeader>

        <CardFooter>
          <p className="truncate text-2xs text-text-subtle">
            {projects
              ? `${plural(projects.length, "project", "projects")} · ${plural(tasks ?? 0, "task", "tasks")}`
              : (workspace.description ?? "No description yet")}
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
}
