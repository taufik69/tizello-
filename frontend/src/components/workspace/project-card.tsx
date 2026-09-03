import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { plural } from "@/lib/plural";
import type { Project } from "@/types/workspace";

/**
 * Flat, not lifted: a project card is not a link yet, and a card that rises
 * under the cursor promises a click that does not exist.
 */
export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="break-words">{project.name}</CardTitle>
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

      <CardFooter>
        <Badge>{plural(project.taskCount, "task", "tasks")}</Badge>
      </CardFooter>
    </Card>
  );
}
