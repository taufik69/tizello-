import type { ProjectPriority, ProjectStatus } from "@/types/project";
import type { ProjectPropertyDef } from "@/types/project-property";

/*
 * The properties a project can carry, as data rather than as hard-coded rows.
 *
 * WHY THIS IS A REGISTRY AND NOT NOTION'S TYPE PICKER
 * --------------------------------------------------
 * Notion's "+ Add a property" offers Text, Number, Formula, Relation, Rollup
 * and a dozen more, because a Notion database's columns ARE its schema — the
 * user is editing the shape of the table.
 *
 * This project's shape is fixed by `backend/prisma/schema.prisma`, which has no
 * JSON column on `Project` to put a user-defined field in (`Workspace` has
 * `settings`; `Project` deliberately has nothing). A picker offering "Formula"
 * would therefore be offering something that cannot survive a page reload.
 *
 * So the picker below is over the project's OWN optional fields. That is the
 * same behaviour Notion's panel actually has for a page whose database already
 * has the column: empty properties are hidden behind "Hide N properties" and
 * "+ Add a property" brings one back. Everything listed here persists.
 *
 * The four required rows — name, key, status, priority — are not in this list.
 * They are always drawn, because a project cannot exist without them.
 */

export const OPTIONAL_PROPERTIES = [
  "description",
  "dates",
  "appearance",
] as const;
export type OptionalProperty = (typeof OPTIONAL_PROPERTIES)[number];

export type PropertyMeta = {
  label: string;
  /** One line in the picker, saying what the row will actually do. */
  hint: string;
  icon: "text" | "calendar" | "palette";
};

export const PROPERTY_META: Record<OptionalProperty, PropertyMeta> = {
  description: {
    label: "Description",
    hint: "A paragraph shown on the card and in the table",
    icon: "text",
  },
  /* Start and end are ONE property, not two. They are validated against each
     other by the API, and a picker that let someone add an end date without a
     start date would be offering a state the server rejects. */
  dates: {
    label: "Dates",
    hint: "A start and end date for the project",
    icon: "calendar",
  },
  appearance: {
    label: "Icon & colour",
    hint: "An emoji and a colour for the project's glyph",
    icon: "palette",
  },
};

export type ProjectDraft = {
  name: string;
  key: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  icon: string;
  color: string;
  startDate: string;
  endDate: string;
};

export const EMPTY_DRAFT: ProjectDraft = {
  name: "",
  key: "",
  description: "",
  status: "PLANNING",
  priority: "MEDIUM",
  icon: "",
  color: "",
  startDate: "",
  endDate: "",
};

/**
 * Which optional rows a draft has to show on open.
 *
 * On CREATE that is none — the drawer starts at the four required rows and
 * grows as properties are added. On EDIT it is every property the project
 * already has a value for: a stored description that only appears after you
 * think to add its row is a description you will assume was lost.
 */
export function shownPropertiesFor(draft: ProjectDraft): OptionalProperty[] {
  return OPTIONAL_PROPERTIES.filter((property) => {
    if (property === "description") return draft.description !== "";
    if (property === "dates") return draft.startDate !== "" || draft.endDate !== "";
    return draft.icon !== "" || draft.color !== "";
  });
}

/**
 * Clears whatever a property owns, so removing a row actually removes the
 * value rather than hiding it — a hidden-but-sent field is how a "removed"
 * description survives a save.
 */
export function clearProperty(
  draft: ProjectDraft,
  property: OptionalProperty,
): Partial<ProjectDraft> {
  if (property === "description") return { description: "" };
  if (property === "dates") return { startDate: "", endDate: "" };
  return { icon: "", color: "" };
}

/**
 * Everything a project control needs from the page it sits on, as one prop.
 *
 * The "+ New project" triggers sit at the bottom of every status group, every
 * board column and every timeline lane, and the actions menu sits on every
 * card and every row — all four or five levels below the page that knows the
 * workspace. Threading `workspaceId`, `workspaceName`, `today`, the schema and
 * the admin flag separately through all of them is twenty-five prop
 * declarations for five values that always travel together.
 *
 * A React context would be the other answer and is the wrong one here: the
 * views are Server Components, and a provider would pull the whole subtree
 * across the client boundary to save some prop plumbing.
 */
export type ProjectScope = {
  workspaceId: string;
  workspaceName: string;
  /** `YYYY-MM-DD`. Resolved on the server — never a clock read in a component. */
  today: string;
  /**
   * The workspace's custom-property schema, fetched once on the server and
   * passed down. Every drawer renders the same columns, so fetching it per
   * trigger would be one request per board column.
   */
  definitions: ProjectPropertyDef[];
  /** Workspace OWNER/ADMIN. Decides whether the schema controls are DRAWN — the API enforces it. */
  canManageProperties: boolean;
};
