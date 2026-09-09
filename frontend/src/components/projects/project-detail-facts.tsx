import { formatDate } from "@/lib/format-date";
import { PROJECT_ROLE_LABEL, type ProjectRecord } from "@/types/project";

/**
 * The record behind the project, as a definition list — everything
 * `GET /projects/:id` returns that the header does not already show.
 *
 * A `<dl>` rather than a table: these are one project's attributes, not rows
 * to compare, and the term/description pairing is what a screen reader needs
 * to read "Created — 21 Aug 2026" as one fact instead of two cells.
 *
 * Dates go through `formatDate`, which pins the locale and the time zone. The
 * default `toLocaleDateString()` resolves against the host — the container on
 * the server, the reader's machine in the browser — and the two disagree,
 * which throws the node away with a hydration mismatch.
 *
 * `viewerRole` of `null` reads as "Viewer", not as a blank: a workspace member
 * who is on no project row still has read access (project.md §*Guards* step
 * 4), and that IS their standing rather than an absent value.
 */
export function ProjectDetailFacts({ project }: { project: ProjectRecord }) {
  const facts = [
    { term: "Key", detail: project.key },
    {
      term: "Your role",
      detail: project.viewerRole ? PROJECT_ROLE_LABEL[project.viewerRole] : "Viewer",
    },
    { term: "Filed", detail: project.isArchived ? "Archived" : "Active" },
    { term: "Starts", detail: project.startDate ? formatDate(project.startDate) : "—" },
    { term: "Ends", detail: project.endDate ? formatDate(project.endDate) : "—" },
    { term: "Created", detail: formatDate(project.createdAt) },
    { term: "Last updated", detail: formatDate(project.updatedAt) },
  ];

  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold tracking-widest text-text-subtle uppercase">
        Details
      </h2>

      <dl className="mt-4 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.term} className="bg-surface px-4 py-3">
            <dt className="text-2xs font-medium tracking-wide text-text-subtle uppercase">
              {fact.term}
            </dt>
            <dd className="mt-1 truncate text-sm text-text">{fact.detail}</dd>
          </div>
        ))}

        <div className="bg-surface px-4 py-3 sm:col-span-2 lg:col-span-3">
          <dt className="text-2xs font-medium tracking-wide text-text-subtle uppercase">
            Description
          </dt>
          <dd className="mt-1 text-sm text-text">
            {project.description ?? (
              <span className="text-text-subtle">No description yet</span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
