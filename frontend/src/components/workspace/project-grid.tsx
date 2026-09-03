import { NewProjectCard } from "@/components/workspace/new-project-card";
import { ProjectCard } from "@/components/workspace/project-card";
import type { Project } from "@/types/workspace";

export function ProjectGrid({
  projects,
  workspaceName,
}: {
  projects: Project[];
  workspaceName: string;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold tracking-widest text-text-subtle uppercase">
        Projects
      </h2>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <li key={project.id}>
            <ProjectCard project={project} />
          </li>
        ))}
        <li>
          <NewProjectCard workspaceName={workspaceName} />
        </li>
      </ul>
    </section>
  );
}
