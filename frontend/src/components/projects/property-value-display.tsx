import { FilePreview } from "@/components/projects/file-preview";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format-date";
import type {
  ProjectPropertyDef,
  PropertyValue,
  UploadedFile,
} from "@/types/project-property";

/**
 * One property's value, READ-ONLY, formatted by its definition's type.
 *
 * The sibling of `property-value-field.tsx`, which is the same switch as
 * editable controls. Two components rather than a `readOnly` prop on that one:
 * the editable version is a Client Component (every branch has an `onChange`),
 * and a detail page that only DISPLAYS values has no reason to ship any of it
 * to the browser.
 *
 * A switch rather than a lookup so TypeScript checks exhaustiveness — a tenth
 * type added to `PROPERTY_TYPES` without a branch here is a build error, not a
 * row that silently renders nothing.
 *
 * `value` arrives as whatever the API stored, so every branch narrows before
 * it renders. A stored value that does not match its definition's type is a
 * schema that changed under it, and "—" is the honest answer.
 */
export function PropertyValueDisplay({
  definition,
  value,
}: {
  definition: ProjectPropertyDef;
  value: PropertyValue | undefined;
}) {
  const empty = <span className="text-text-subtle">—</span>;

  switch (definition.type) {
    case "CHECKBOX":
      return <span>{value === true ? "Yes" : "No"}</span>;

    case "DATE":
      return typeof value === "string" && value ? (
        <span>{formatDate(value)}</span>
      ) : (
        empty
      );

    case "SELECT": {
      const option = definition.options?.find((entry) => entry.id === value);
      if (!option) return empty;

      return (
        <span className="inline-flex items-center gap-1.5">
          {option.color && (
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-full border border-border"
              style={{ backgroundColor: option.color }}
            />
          )}
          {option.label}
        </span>
      );
    }

    case "MULTI_SELECT": {
      const ids = (Array.isArray(value) ? value : []).filter(
        (entry): entry is string => typeof entry === "string",
      );
      const chosen = (definition.options ?? []).filter((entry) =>
        ids.includes(entry.id),
      );
      if (chosen.length === 0) return empty;

      return (
        <span className="flex flex-wrap gap-1">
          {chosen.map((option) => (
            <Badge key={option.id}>{option.label}</Badge>
          ))}
        </span>
      );
    }

    case "FILES": {
      const files = (Array.isArray(value) ? value : []).filter(isUploadedFile);
      if (files.length === 0) return empty;

      return (
        /* A grid, not a stack: images tile two or three across where a list
           gave each 44px thumbnail a whole row of its own. `FilePreview` puts
           `col-span` on the documents, which are the ones that need the
           width. */
        <ul className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {files.map((file) => (
            <FilePreview key={file.id} file={file} />
          ))}
        </ul>
      );
    }

    case "URL":
      return typeof value === "string" && value ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="break-all text-text-brand underline underline-offset-2"
        >
          {value}
        </a>
      ) : (
        empty
      );

    case "EMAIL":
      return typeof value === "string" && value ? (
        <a
          href={`mailto:${value}`}
          className="break-all text-text-brand underline underline-offset-2"
        >
          {value}
        </a>
      ) : (
        empty
      );

    case "PHONE":
      return typeof value === "string" && value ? (
        <a href={`tel:${value}`} className="text-text-brand underline underline-offset-2">
          {value}
        </a>
      ) : (
        empty
      );

    /* TEXT and NUMBER. `0` and `false` are real values, so the emptiness test
       is against `""`, `null` and `undefined` rather than falsiness. */
    default: {
      if (value === undefined || value === null || value === "") return empty;
      return <span className="break-words">{String(value)}</span>;
    }
  }
}

/** A value arrives from the API as `unknown` until it is checked — this is that check. */
function isUploadedFile(entry: unknown): entry is UploadedFile {
  return (
    Boolean(entry) &&
    typeof entry === "object" &&
    "storedName" in (entry as object) &&
    "name" in (entry as object)
  );
}
