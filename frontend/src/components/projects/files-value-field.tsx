"use client";

import { useRef, useState, useTransition } from "react";
import { PlusIcon } from "@/components/ui/icons";
import { uploadFileAction } from "@/lib/actions/upload-actions";
import { formatBytes, MAX_UPLOAD_BYTES } from "@/lib/upload-limits";
import type { PropertyValue, UploadedFile } from "@/types/project-property";

/**
 * The value control for a `FILES` property: the attachments, and a way to add
 * one.
 *
 * UPLOADING AND SAVING ARE TWO STEPS, and that is what the API does rather
 * than a shortcut. `POST /uploads` writes the bytes and hands back metadata;
 * that metadata then rides the project's own Save like every other property
 * value. So a file picked here is on disk immediately and attached to the
 * project only when the drawer is saved.
 *
 * The cost is an orphan: a file uploaded into a drawer somebody then cancels
 * stays on disk, referenced by nothing. Deleting it would need the server to
 * prove no project references it, which is a scan of every project's Json —
 * `docs/api/upload.md` tracks the sweep job as the eventual answer rather than
 * solving it badly here.
 *
 * Removing a file from this list detaches it; it does not delete the bytes,
 * for the same reason.
 */
const MAX_FILES = 20;

/*
 * The picker offers only what the server will actually store.
 *
 * `shared/middlewares/upload.js` allowlists thirteen MIME types and answers
 * `415 "That file type is not allowed"` for everything else — video and SVG
 * included (an SVG is an XML document that can carry script, so serving one
 * from this origin would be a stored-XSS primitive). Without `accept` the OS
 * dialog happily offers an .mp4 and the rejection arrives after the upload,
 * which reads as "it did not take my file" rather than as a rule.
 *
 * It is a hint, not a control: a determined user can still pick anything, and
 * the server is what enforces the list. Keep the two in sync.
 */
const ACCEPT = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
].join(",");

export function FilesValueField({
  value,
  onChange,
}: {
  /** `unknown[]` because a stored value is whatever the API returned until it is checked — `isUploadedFile` below is that check. */
  value: unknown[];
  /**
   * May be async, and is AWAITED. The Files & media row creates the workspace
   * column inside this call when there is not one yet, and the button has to
   * stay disabled across that write — otherwise a second pick lands while the
   * first has nowhere to be written and overwrites it.
   */
  onChange: (value: PropertyValue) => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  const files: UploadedFile[] = value.filter(isUploadedFile);

  function pick(selected: File | undefined) {
    if (!selected) return;

    if (files.length >= MAX_FILES) {
      setError(`Up to ${MAX_FILES} files.`);
      return;
    }

    /* Checked HERE, before the request, because the layer that would
       otherwise catch it cannot report. Next rejects an over-limit Server
       Action body rather than returning from the action, so the message the
       API wrote for this case never arrives — the throw lands on the segment's
       `error.tsx` and the whole page is replaced by "The projects didn't
       load". See `lib/upload-limits.ts`. */
    if (selected.size > MAX_UPLOAD_BYTES) {
      setError(
        `${formatBytes(selected.size)} is too big — files must be ${formatBytes(MAX_UPLOAD_BYTES)} or smaller.`,
      );
      return;
    }

    const body = new FormData();
    body.append("file", selected);

    startTransition(async () => {
      /* The guard above is the expected path, not the only one: an action can
         still reject for something no client check anticipates, and an
         uncaught rejection in a transition takes the page down rather than the
         row. A failed upload is a sentence under the field. */
      try {
        const result = await uploadFileAction(body);

        if (!result.ok) {
          setError(result.message);
          return;
        }

        setError(undefined);
        await onChange([...files, result.file]);
      } catch {
        setError("That file could not be uploaded. Try again.");
      }
    });
  }

  return (
    <div className="rounded-sm border border-transparent px-2.5 py-1.5 transition-colors duration-100 ease-standard hover:bg-surface-hover">
      {files.length > 0 && (
        <ul className="mb-1 flex flex-col gap-1">
          {files.map((file) => (
            <li key={file.id} className="flex items-center gap-2">
              <FileGlyph mime={file.mime} />
              <span className="min-w-0 flex-1 truncate text-sm text-text">
                {file.name}
              </span>
              <span className="shrink-0 text-2xs text-text-subtle">
                {formatBytes(file.size)}
              </span>
              <button
                type="button"
                onClick={() => onChange(files.filter((entry) => entry.id !== file.id))}
                aria-label={`Remove ${file.name}`}
                className="grid size-6 shrink-0 place-items-center rounded-sm text-text-subtle transition-colors duration-100 ease-standard hover:bg-surface-sunken hover:text-danger"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-3" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => {
          pick(event.target.files?.[0]);
          /* Cleared so picking the SAME file twice still fires `change` — the
             input's value is unchanged otherwise and the event never comes. */
          event.target.value = "";
        }}
      />

      {/* "Add a file", not "Empty". Every other property row uses "Empty" as
          its placeholder, but this one IS the control — a placeholder where a
          button belongs is the reason the row read as inert. */}
      <button
        type="button"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1.5 rounded-sm text-sm text-text-subtle transition-colors duration-100 ease-standard hover:text-text disabled:opacity-50"
      >
        <PlusIcon className="size-3.5" />
        {isPending ? "Uploading…" : files.length === 0 ? "Add a file" : "Add another"}
      </button>

      {error && <p className="mt-1 text-2xs text-danger">{error}</p>}
    </div>
  );
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

/** An image gets a picture mark, everything else a document one. Decorative — the filename sits beside it. */
function FileGlyph({ mime }: { mime: string }) {
  const isImage = mime.startsWith("image/");

  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 shrink-0 text-text-subtle" aria-hidden="true">
      {isImage ? (
        <>
          <rect x="2.5" y="3" width="11" height="10" rx="1.5" />
          <path d="M2.5 10.5l3-2.5 3 2.5 2-1.5 3 2" />
        </>
      ) : (
        <path d="M9 2.5H4.5v11h7V5L9 2.5zM9 2.5V5h2.5" />
      )}
    </svg>
  );
}
