import { AppImage } from "@/components/ui/app-image";
import { PdfPreview } from "@/components/projects/pdf-preview";
import { SheetPreview } from "@/components/projects/sheet-preview";
import { formatBytes } from "@/lib/upload-limits";
import {
  isImage,
  isLegacySheet,
  isPdf,
  isSheet,
  isTextPreviewable,
  readTextPreview,
  uploadUrl,
} from "@/lib/uploads";
import { cn } from "@/lib/cn";
import type { UploadedFile } from "@/types/project-property";

/**
 * One attachment, as a card in the Files & media grid.
 *
 * EVERY URL GOES THROUGH `uploadUrl`, never through the `url` the value
 * stores. That stored value is `/uploads/<storedName>` — a path on the API,
 * relative to nothing the browser knows — where `uploadUrl` resolves the
 * public `/static` mount (`lib/uploads.ts` explains what that costs).
 *
 * Four kinds get a preview, and each is drawn by whoever can afford to:
 *
 * - **Images** — `unoptimized`, because `next/image`'s optimiser refuses
 *   loopback and private hosts as an SSRF guard, so a `remotePatterns` entry
 *   for a local API is accepted by the config and then rejected at request
 *   time. `next.config.ts` records the bisect. `fill` + `sizes` still give the
 *   layout box, so nothing shifts.
 * - **PDFs** — pdf.js, in a lazily-loaded client chunk (`pdf-preview.tsx`).
 * - **Spreadsheets** — parsed on the SERVER into a table, so the browser gets
 *   no parser at all (`sheet-preview.tsx`).
 * - **Text, CSV and JSON** — read on the server, capped at 16 KB.
 *
 * A zip, a `.docx` and a legacy `.xls` are links, because there is nothing
 * honest to draw for them.
 */
export async function FilePreview({ file }: { file: UploadedFile }) {
  const href = uploadUrl(file.storedName);
  const text =
    href && isTextPreviewable(file.mime) ? await readTextPreview(file.storedName) : null;

  return (
    <li
      className={cn(
        "flex flex-col overflow-hidden rounded-md border border-border",
        /* Documents take the whole row; an image is a tile. A PDF page or a
           spreadsheet squeezed into a third of the width is unreadable. */
        href && !isImage(file.mime) && "sm:col-span-2 xl:col-span-3",
      )}
    >
      <div className="flex items-center gap-2 bg-surface-sunken px-3 py-2">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1 truncate text-sm text-text-brand underline underline-offset-2"
          >
            {file.name}
          </a>
        ) : (
          /* No `NEXT_PUBLIC_UPLOADS_URL`, or a name this server did not write.
             The card still names the file — losing the link is better than
             rendering one that goes nowhere. */
          <span className="min-w-0 flex-1 truncate text-sm text-text">{file.name}</span>
        )}
        <span className="shrink-0 text-2xs text-text-subtle">
          {formatBytes(file.size)}
        </span>
      </div>

      {href && isImage(file.mime) && (
        <a href={href} target="_blank" rel="noreferrer" className="block">
          <span className="relative block h-44 w-full bg-canvas">
            <AppImage
              src={href}
              alt={file.name}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-contain"
            />
          </span>
        </a>
      )}

      {href && isPdf(file.mime) && <PdfPreview url={href} name={file.name} />}

      {href && isSheet(file.mime) && <SheetPreview storedName={file.storedName} />}

      {isLegacySheet(file.mime) && (
        <p className="px-3 py-3 text-2xs text-text-subtle">
          Legacy .xls files open in a spreadsheet app — download to view.
        </p>
      )}

      {text && (
        <div className="bg-canvas">
          <pre className="max-h-64 overflow-auto px-3 py-2 font-mono text-2xs whitespace-pre-wrap text-text-muted">
            {text.body}
          </pre>
          {text.truncated && (
            <p className="border-t border-border px-3 py-1.5 text-2xs text-text-subtle">
              Showing the first 16 KB — open the file for the rest.
            </p>
          )}
        </div>
      )}
    </li>
  );
}
