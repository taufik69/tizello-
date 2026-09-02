/*
 * Hand-rolled 12px glyphs rather than an icon package — the board needs five,
 * and a dependency would ship far more than that. All inherit currentColor.
 */
type IconProps = { className?: string };

function Icon({ children, className }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "size-3.5 shrink-0"}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5V8l2.5 1.5" />
    </Icon>
  );
}

export function ChecklistIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 5.5l1.5 1.5 2.5-3" />
      <path d="M2.5 11.5l1.5 1.5 2.5-3" />
      <path d="M9 5h4.5M9 11h4.5" />
    </Icon>
  );
}

export function CommentIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13.5 9.5a1.5 1.5 0 01-1.5 1.5H6l-3 2.5V4a1.5 1.5 0 011.5-1.5h7A1.5 1.5 0 0113.5 4z" />
    </Icon>
  );
}

export function AttachmentIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M11 6.5L6.5 11a2.12 2.12 0 01-3-3l5-5a1.41 1.41 0 012 2l-5 5a.71.71 0 01-1-1L9 4.5" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 3.5v9M3.5 8h9" />
    </Icon>
  );
}
