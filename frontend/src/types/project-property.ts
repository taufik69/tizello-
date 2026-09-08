/*
 * The workspace's project-database schema — `backend/docs/api/project-property.md`.
 *
 * DEFINITIONS ARE WORKSPACE-SCOPED, VALUES ARE PER PROJECT. Adding a property
 * adds the column to every project in the workspace; each fills in its own
 * value. That is why `ProjectPropertyDef` has a `workspaceId` and the values
 * live on `ProjectRecord.properties` keyed by definition id.
 */

/**
 * The ten types the API can store.
 *
 * `FORMULA`, `ROLLUP` and `RELATION` are still absent — each is blocked on a
 * specific missing thing (an expression evaluator, a second entity to relate
 * to), and offering one would offer something that cannot survive a reload.
 *
 * `PERSON` is absent for a different reason: collaborators are `ProjectMember`
 * rows with their own endpoints, so a person-shaped property would be a second
 * answer to "who is on this project". The Collaborators row uses the real
 * relation instead.
 */
export const PROPERTY_TYPES = [
  "TEXT",
  "NUMBER",
  "SELECT",
  "MULTI_SELECT",
  "DATE",
  "CHECKBOX",
  "URL",
  "EMAIL",
  "PHONE",
  "FILES",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

/** The two types whose `options` array is meaningful. */
export const OPTION_TYPES: PropertyType[] = ["SELECT", "MULTI_SELECT"];

export type PropertyOption = {
  /** What a value stores. Stable across a label rename, which is the point. */
  id: string;
  label: string;
  color?: string;
};

export type ProjectPropertyDef = {
  id: string;
  workspaceId: string;
  name: string;
  /** Immutable after create — the API rejects it in a PATCH. */
  type: PropertyType;
  /** `[]` for SELECT/MULTI_SELECT, `null` for the other seven. */
  options: PropertyOption[] | null;
  position: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * One project's values. `null` is not a member of this union — sending `null`
 * for a key is how a value is DELETED, so it is a request shape rather than a
 * stored one.
 */
/** One entry of a FILES value — exactly what `POST /uploads` hands back. */
export type UploadedFile = {
  id: string;
  /** What the user recognises. Never touches the filesystem. */
  name: string;
  /** The generated `<uuid>.<ext>` the server stored it as. */
  storedName: string;
  /** Always `/uploads/<storedName>` — the API rejects anything else. */
  url: string;
  size: number;
  mime: string;
};

export type PropertyValue = string | number | boolean | string[] | UploadedFile[];
export type ProjectPropertyValues = Record<string, PropertyValue>;

/** What a PATCH sends: partial, and `null` deletes a key. */
export type ProjectPropertyPatch = Record<string, PropertyValue | null>;

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  TEXT: "Text",
  NUMBER: "Number",
  SELECT: "Select",
  MULTI_SELECT: "Multi-select",
  DATE: "Date",
  CHECKBOX: "Checkbox",
  URL: "URL",
  EMAIL: "Email",
  PHONE: "Phone",
  FILES: "Files & media",
};

/** One line in the type picker, saying what the column will hold. */
export const PROPERTY_TYPE_HINT: Record<PropertyType, string> = {
  TEXT: "A line or a paragraph",
  NUMBER: "A figure you can total later",
  SELECT: "One choice from a list you define",
  MULTI_SELECT: "Any number of choices from a list",
  DATE: "A single day",
  CHECKBOX: "Done or not",
  URL: "A link",
  EMAIL: "An address",
  PHONE: "A number to call",
  FILES: "Documents and images",
};

/** The default a newly-added row starts at, so a property is never `undefined` in a controlled input. */
export function emptyValueFor(type: PropertyType): PropertyValue {
  if (type === "CHECKBOX") return false;
  if (type === "MULTI_SELECT" || type === "FILES") return [];
  if (type === "NUMBER") return 0;
  return "";
}
