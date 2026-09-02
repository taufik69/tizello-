/*
 * Monochrome provider marks, drawn inline. Both inherit `currentColor` so they
 * read correctly in either theme — Google's four-colour G is not legible as a
 * 16px glyph on a dark surface, and shipping two raster assets for two buttons
 * is a worse trade than a simplified mark.
 */
type MarkProps = { className?: string };

export function GoogleMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 16 16" className={className ?? "size-4 shrink-0"} aria-hidden="true">
      <path
        fill="currentColor"
        d="M8.15 7.05v2.02h3.34a2.86 2.86 0 0 1-1.22 1.87l1.97 1.53c1.15-1.06 1.81-2.62 1.81-4.47 0-.43-.04-.85-.11-1.25zM8.15 13.6c1.65 0 3.03-.54 4.04-1.48l-1.97-1.53c-.55.37-1.25.59-2.07.59-1.59 0-2.94-1.07-3.42-2.51l-2.03 1.57A6.1 6.1 0 0 0 8.15 13.6M4.73 8.67a3.7 3.7 0 0 1 0-2.34L2.7 4.76a6.1 6.1 0 0 0 0 5.48zM8.15 4.32c.9 0 1.7.31 2.34.92l1.74-1.74A6.06 6.06 0 0 0 2.7 4.76l2.03 1.57c.48-1.44 1.83-2.01 3.42-2.01"
      />
    </svg>
  );
}

export function GitHubMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 16 16" className={className ?? "size-4 shrink-0"} aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 .8a7.2 7.2 0 0 0-2.28 14.03c.36.07.49-.16.49-.35v-1.23c-2 .44-2.43-.96-2.43-.96-.33-.84-.8-1.06-.8-1.06-.65-.45.05-.44.05-.44.73.05 1.11.75 1.11.75.64 1.1 1.69.78 2.1.6.07-.47.25-.79.46-.97-1.6-.18-3.28-.8-3.28-3.56 0-.79.28-1.43.75-1.93-.08-.19-.32-.92.07-1.91 0 0 .6-.2 1.98.73a6.8 6.8 0 0 1 3.6 0c1.37-.93 1.97-.73 1.97-.73.4.99.15 1.72.07 1.9.47.51.75 1.15.75 1.94 0 2.77-1.68 3.38-3.29 3.56.26.22.49.66.49 1.33v1.97c0 .19.13.42.5.35A7.2 7.2 0 0 0 8 .8"
      />
    </svg>
  );
}
