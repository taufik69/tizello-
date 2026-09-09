import { PropertyTypeIcon } from "@/components/projects/property-type-icons";
import { PropertyValueDisplay } from "@/components/projects/property-value-display";
import {
  PROPERTY_TYPE_LABEL,
  type ProjectPropertyDef,
  type PropertyValue,
} from "@/types/project-property";
import type { ProjectRecord } from "@/types/project";

/**
 * The workspace's custom properties, with this project's values.
 *
 * These were collected by the create and edit drawers and then shown nowhere:
 * the detail page rendered the columns the API returns as fields (`Key`,
 * `Starts`, `Description`…) and skipped `properties` entirely, so a Files &
 * media attachment or a Region could be set, saved and never seen again
 * outside the drawer that set it.
 *
 * EVERY DEFINITION IS DRAWN, not only the ones with a value. A column the
 * workspace defines is part of the shape of a project, and a panel that hides
 * the empty ones answers "does this project have a launch date" with silence —
 * the same argument `shownPropertiesFor` makes for the drawer showing every
 * optional row from the start.
 *
 * A Server Component. Nothing here is interactive; editing is the drawer's
 * job, and `property-value-display.tsx` exists precisely so this page ships no
 * JavaScript for it.
 *
 * The definitions arrive already ordered by `position` — the API sorts them —
 * so the panel, the drawer and the table all list them the same way.
 */
export function ProjectPropertiesPanel({
  project,
  definitions,
}: {
  project: ProjectRecord;
  definitions: ProjectPropertyDef[];
}) {
  /* Nothing defined at all: the section would be a heading over an empty box,
     and a workspace that has never added a property is not missing anything. */
  if (definitions.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold tracking-widest text-text-subtle uppercase">
        Properties
      </h2>

      <dl className="mt-4 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {definitions.map((definition) => (
          <div
            key={definition.id}
            /* A file list and a paragraph both outgrow one cell of a
               three-column grid, so those two types take the full row. */
            className={
              definition.type === "FILES"
                ? "bg-surface px-4 py-3 sm:col-span-2 lg:col-span-3"
                : "bg-surface px-4 py-3"
            }
          >
            <dt
              className="flex items-center gap-1.5 text-2xs font-medium tracking-wide text-text-subtle uppercase"
              title={PROPERTY_TYPE_LABEL[definition.type]}
            >
              <PropertyTypeIcon type={definition.type} />
              <span className="min-w-0 truncate">{definition.name}</span>
            </dt>
            <dd className="mt-1 text-sm text-text">
              <PropertyValueDisplay
                definition={definition}
                value={
                  (project.properties[definition.id] ?? undefined) as
                    | PropertyValue
                    | undefined
                }
              />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
