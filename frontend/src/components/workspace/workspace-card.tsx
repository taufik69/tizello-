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
 */
export function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const { id, name, memberCount, role, accent, projects } = workspace;
  const tasks = projects.reduce((total, project) => total + project.taskCount, 0);

  return (
    <Link
      href={`/workspaces/${id}`}
      className="group block h-full rounded-md transition-transform duration-100 ease-standard hover:-translate-y-0.5"
    >
      <Card className="h-full transition-shadow duration-100 ease-standard group-hover:shadow-raised">
        <CardHeader className="gap-3">
          <div className="flex items-start gap-3">
            <WorkspaceAvatar name={name} accent={accent} />

            <div className="min-w-0 flex-1">
              <CardTitle className="line-clamp-2 break-words">{name}</CardTitle>
              <p className="mt-0.5 text-2xs text-text-subtle">
                {plural(memberCount, "member", "members")}
              </p>
            </div>

            {role === "OWNER" && <RoleBadge role={role} />}
          </div>
        </CardHeader>

        <CardFooter>
          <p className="text-2xs text-text-subtle">
            {plural(projects.length, "project", "projects")} ·{" "}
            {plural(tasks, "task", "tasks")}
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
}
