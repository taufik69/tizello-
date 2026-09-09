import type { PropertyType } from "@/types/project-property";

/*
 * One 16px glyph per property type, on the same grid and 1.5 stroke as
 * `ui/icons.tsx`. A separate file rather than entries there because these are
 * picker decoration for one menu, not part of the app's icon set.
 */
const PATHS: Record<PropertyType, React.ReactNode> = {
  TEXT: <path d="M2.5 4h11M2.5 8h11M2.5 12h7" />,
  NUMBER: <path d="M5.5 2.5L4 13.5M11 2.5L9.5 13.5M2.5 5.5h11M2 10.5h11" />,
  SELECT: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <circle cx="8" cy="8" r="2" />
    </>
  ),
  MULTI_SELECT: (
    <>
      <path d="M6 4h7.5M6 8h7.5M6 12h7.5" />
      <circle cx="3" cy="4" r="0.9" fill="currentColor" />
      <circle cx="3" cy="8" r="0.9" fill="currentColor" />
      <circle cx="3" cy="12" r="0.9" fill="currentColor" />
    </>
  ),
  DATE: (
    <>
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
      <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
    </>
  ),
  CHECKBOX: (
    <>
      <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
      <path d="M5.5 8l1.8 1.8L10.5 6.5" />
    </>
  ),
  URL: <path d="M6.5 9.5a2.5 2.5 0 003.5 0l2-2a2.5 2.5 0 00-3.5-3.5l-.8.8M9.5 6.5a2.5 2.5 0 00-3.5 0l-2 2a2.5 2.5 0 003.5 3.5l.8-.8" />,
  EMAIL: (
    <>
      <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
      <path d="M2.5 5l5.5 4 5.5-4" />
    </>
  ),
  PHONE: <path d="M5 2.5l2 2.5-1.5 1.5a8 8 0 004 4L11 9l2.5 2-1.5 2c-4.5.5-9.5-4.5-9-9z" />,
  FILES: <path d="M9 2.5H4.5v11h7V5L9 2.5zM9 2.5V5h2.5" />,
};

export function PropertyTypeIcon({
  type,
  className = "size-3.5 shrink-0 text-text-subtle",
}: {
  type: PropertyType;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[type]}
    </svg>
  );
}
