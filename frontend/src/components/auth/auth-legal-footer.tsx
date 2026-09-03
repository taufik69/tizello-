/**
 * The legal links pinned to the bottom of the auth column.
 *
 * Extracted because `AuthColumn` is not the only thing that has to render it:
 * a `loading.tsx` fallback cannot reuse `AuthColumn` itself (it renders the
 * screen's `<h1>`, and a fallback carrying a heading puts a second one into the
 * streamed HTML), but it must still produce the same three-child flex column —
 * otherwise the `flex-1` middle absorbs this row's height and the centred
 * content jumps the moment the real page swaps in.
 */
export function AuthLegalFooter() {
  return (
    <footer className="flex gap-4 text-2xs text-text-subtle">
      <a href="/privacy" className="rounded-xs hover:text-text-muted">
        Privacy
      </a>
      <a href="/terms" className="rounded-xs hover:text-text-muted">
        Terms
      </a>
    </footer>
  );
}
