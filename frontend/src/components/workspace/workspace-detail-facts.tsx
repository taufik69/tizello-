import { ROLE_LABEL } from "@/lib/roles";
import { formatDate } from "@/lib/format-date";
import type { Workspace } from "@/types/workspace";

/**
 * The record behind the workspace, as a definition list — everything
 * `GET /workspaces/:id` returns that the header does not already show.
 *
 * A `<dl>` rather than a table: these are one workspace's attributes, not rows
 * to compare, and the term/description pairing is what a screen reader needs to
 * read "Created — 21 Aug 2026" as one fact instead of two cells.
 *
 * Dates go through `formatDate`, which pins the locale and the time zone. The
 * default `toLocaleDateString()` resolves against the host — the container on
 * the server, the reader's machine in the browser — and the two disagree, which
 * throws the node away with a hydration mismatch.
 */
export function WorkspaceDetailFacts({ workspace }: { workspace: Workspace }) {
  const facts = [
    { term: "Web address", detail: `@${workspace.slug}` },
    { term: "Your role", detail: ROLE_LABEL[workspace.role] },
    { term: "Status", detail: workspace.isArchived ? "Archived" : "Active" },
    { term: "Created", detail: formatDate(workspace.createdAt) },
    { term: "Last updated", detail: formatDate(workspace.updatedAt) },
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

        <div className="bg-surface px-4 py-3">
          <dt className="text-2xs font-medium tracking-wide text-text-subtle uppercase">
            Description
          </dt>
          <dd className="mt-1 text-sm text-text">
            {workspace.description ?? (
              <span className="text-text-subtle">No description yet</span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
