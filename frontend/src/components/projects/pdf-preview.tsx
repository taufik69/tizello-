"use client";

import dynamic from "next/dynamic";

/**
 * The boundary that keeps pdf.js off every other page.
 *
 * `ssr: false` is required rather than tidy: `react-pdf` reaches for
 * `DOMMatrix` and `canvas` at module scope, neither of which exists in Node,
 * so importing it during a server render throws before anything can be drawn.
 *
 * `next/dynamic` also means the ~1 MB of parser is a separate chunk fetched
 * only when a project actually has a PDF attached — a project with three PNGs
 * downloads none of it. That is the whole reason this indirection exists
 * instead of importing `PdfViewer` straight into the file card.
 *
 * `ssr: false` cannot be used from a Server Component, which is why this file
 * carries `"use client"` and `file-preview.tsx` — which is a Server Component
 * — imports this rather than `next/dynamic` itself.
 */
const PdfViewer = dynamic(
  () => import("@/components/projects/pdf-viewer").then((mod) => mod.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <p className="px-3 py-8 text-center text-xs text-text-subtle">Loading viewer…</p>
    ),
  },
);

export function PdfPreview({ url, name }: { url: string; name: string }) {
  return <PdfViewer url={url} name={name} />;
}
