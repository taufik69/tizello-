"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

/*
 * pdf.js runs its parser in a worker, and the worker file has to be reachable
 * as a URL. `new URL(..., import.meta.url)` is what makes the bundler emit it
 * as an asset and hand back the hashed path — a bare string would be a
 * relative URL resolved against the PAGE, which is a 404 on every route but
 * the root.
 */
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

/**
 * A PDF, rendered by pdf.js rather than by the browser.
 *
 * `<object data={url} type="application/pdf">` was the previous answer and it
 * drew nothing. The likeliest cause is a header this app sets on purpose: the
 * API's `/static` mount sends `Content-Security-Policy: default-src 'none';
 * sandbox` on every file, and a sandboxed response cannot start the browser's
 * built-in PDF plugin. It was not proven — that needs a browser, and the fix
 * would have meant weakening the header that defangs anything ever served from
 * that directory which a browser would otherwise treat as a document.
 *
 * pdf.js sidesteps the question rather than answering it. It never asks the
 * browser to VIEW the file; it fetches the bytes and draws to a canvas, so no
 * plugin, no embedded document, and nothing for a sandbox to restrict. It also
 * removes the two things the native viewer could never give: it looks the same
 * in every browser, and it renders on a device that has no PDF plugin at all.
 *
 * pdf.js fetches the bytes with `fetch`, so it needs CORS rather than just
 * `Cross-Origin-Resource-Policy` — the API's `cors({ origin: clientOrigin })`
 * is mounted before the static handler, which is what makes that work.
 *
 * Only the FIRST page is drawn. A preview on a project page is a glance, and
 * the page count below it plus the link above it are the way to the rest.
 */
export function PdfViewer({ url, name }: { url: string; name: string }) {
  const [pages, setPages] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <p className="px-3 py-4 text-sm text-text-muted">
        This PDF could not be rendered.{" "}
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-text-brand underline underline-offset-2"
        >
          Open {name}
        </a>
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 bg-canvas py-3">
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setPages(numPages)}
        onLoadError={() => setFailed(true)}
        loading={
          <p className="px-3 py-8 text-xs text-text-subtle">Loading {name}…</p>
        }
        error={null}
      >
        {/* A fixed width rather than a measured one: the card it sits in is a
            grid cell whose width is known from the layout, and measuring would
            mean a resize observer and a re-render per drag of the window. */}
        <Page
          pageNumber={1}
          width={560}
          renderAnnotationLayer={false}
          className="[&_canvas]:!h-auto [&_canvas]:!w-full [&_canvas]:rounded-sm"
        />
      </Document>

      {pages !== null && pages > 1 && (
        <p className="text-2xs text-text-subtle">
          Page 1 of {pages} —{" "}
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-text-brand underline underline-offset-2"
          >
            open the full document
          </a>
        </p>
      )}
    </div>
  );
}
