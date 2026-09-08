/*
 * The three glyphs the property picker draws, on the same 16px grid and 1.5
 * stroke as `ui/icons.tsx`. A separate file rather than entries there because
 * these are picker decoration for one menu, not part of the app's icon set —
 * and because `add-property-menu.tsx` is at the 150-line cap without them.
 */
export type PropertyIconKind = "text" | "calendar" | "palette";

export function PropertyIcon({ kind }: { kind: PropertyIconKind }) {
  const paths = {
    text: <path d="M2.5 4h11M2.5 8h11M2.5 12h7" />,
    calendar: (
      <>
        <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
        <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
      </>
    ),
    palette: (
      <>
        <circle cx="8" cy="8" r="5.5" />
        <circle cx="8" cy="5.5" r="0.75" fill="currentColor" />
        <circle cx="5.5" cy="9" r="0.75" fill="currentColor" />
        <circle cx="10.5" cy="9" r="0.75" fill="currentColor" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 size-3.5 shrink-0 text-text-subtle"
      aria-hidden="true"
    >
      {paths[kind]}
    </svg>
  );
}
