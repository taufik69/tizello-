"use client";

/**
 * Says that what is on screen is not a blank form.
 *
 * A drawer that quietly reopens with somebody's half-typed project is worse
 * than one that loses it: the values look like the app's own defaults, and the
 * first sign otherwise is a project created with a name from last week. So the
 * restore is stated, and the way out of it is one click away rather than a
 * field-by-field delete.
 *
 * Neutral ink on a tinted fill, per DESIGN-SYSTEM.md — `text-info` on
 * `bg-info-subtle` is 4.63:1 in light, which passes only barely, and
 * `text-text-muted` is 5.7:1+ on every `-subtle` in both themes.
 */
export function DraftRestoredNotice({ onStartOver }: { onStartOver: () => void }) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-sm bg-info-subtle px-2.5 py-1.5">
      <p className="min-w-0 flex-1 text-xs text-text-muted">
        Picking up where you left off.
      </p>
      <button
        type="button"
        onClick={onStartOver}
        className="shrink-0 rounded-xs px-1.5 py-0.5 text-xs font-medium text-text-muted underline underline-offset-2 transition-colors duration-100 ease-standard hover:text-text"
      >
        Start over
      </button>
    </div>
  );
}
