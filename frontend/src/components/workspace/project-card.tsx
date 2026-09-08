import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectActionsMenu } from "@/components/projects/project-actions-menu";
import { ProjectGlyph } from "@/components/projects/project-glyph";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import type { ProjectRecord } from "@/types/project";
import type { WorkspaceRole } from "@/types/workspace";

/**
 * A project on the workspace detail page.
 *
 * The title carries a stretched link over the whole card, and the actions menu
 * sits above that overlay on its own stacking context — a `<button>` inside an
 * `<a>` is invalid HTML that browsers resolve by dropping one of them. Focus
 * lands on the title and on the menu, two visible stops. Same arrangement as
 * `WorkspaceCard`.
 *
 * The glyph is the project's own emoji on its own colour (`project-glyph.tsx`)
 * — before it existed this card drew nothing for either, so two projects that
 * differed only in appearance looked identical.
 *
 * The footer shows the KEY, not a task count. `taskCounter` is schema-only on
 * the API and appears in no response (project.md §*divergence 3*), so a count
 * here would be an invented number; the key is the thing a person actually
 * quotes.
 */
export function ProjectCard({
  project,
  workspaceId,
  workspaceRole,
}: {
  project: ProjectRecord;
  workspaceId: string;
  workspaceRole: WorkspaceRole;
}) {
  return (
    <Card className="hover-lift relative h-full">
      <CardHeader>
        <div className="flex items-start gap-2.5">
          {/* `lg` here, `sm` in the tables: a card has the room, and the
              colour is most of what makes one card findable in a grid. */}
          <ProjectGlyph icon={project.icon} color={project.color} size="lg" />
          <CardTitle className="min-w-0 flex-1 break-words">
            <Link
              href={`/workspaces/${workspaceId}/projects/${project.id}`}
              className="rounded-xs after:absolute after:inset-0 after:rounded-md"
            >
              {project.name}
            </Link>
          </CardTitle>

          {/* Above the stretched link, so the trigger takes its own clicks and
              the rest of the card still navigates. */}
          <div className="relative z-10 shrink-0">
            <ProjectActionsMenu project={project} workspaceRole={workspaceRole} />
          </div>
        </div>
        {project.description ? (
          <CardDescription className="line-clamp-3">
            {project.description}
          </CardDescription>
        ) : (
          /* Not CardDescription: overriding its `text-text-muted` with
             `text-text-subtle` would leave both in the class list and let the
             stylesheet's order decide, which is not a thing to leave to chance. */
          <p className="text-sm text-text-subtle italic">No description yet</p>
        )}
      </CardHeader>

      <CardFooter className="gap-1.5">
        <Badge className="font-mono">{project.key}</Badge>
        <ProjectStatusBadge status={project.status} />
        {project.isArchived && <Badge variant="warning">Archived</Badge>}
      </CardFooter>
    </Card>
  );
}
