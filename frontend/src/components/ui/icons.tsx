/*
 * Hand-rolled 16px glyphs rather than an icon package — a dependency would ship
 * far more than the handful this app draws. All inherit currentColor.
 *
 * This file holds the board and menu glyphs. The app shell's navigation set
 * lives next door in `nav-icons.tsx` and shares the `Icon` wrapper exported
 * here: one file carrying both would sit over the 150-line cap.
 */
export type IconProps = { className?: string };

export function Icon({
  children,
  className,
}: IconProps & { children: React.ReactNode }) {
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

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6.5L8 10.5l4-4" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 8.5l3.5 3.5L13 4.5" />
    </Icon>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="2.25" />
      <path d="M8 1.5l1 1.6 1.9-.3.4 1.9 1.7.9-1 1.6 1 1.6-1.7.9-.4 1.9-1.9-.3-1 1.6-1-1.6-1.9.3-.4-1.9-1.7-.9 1-1.6-1-1.6 1.7-.9.4-1.9 1.9.3z" />
    </Icon>
  );
}

/** The kebab. Icon-only triggers that use it always carry an `aria-label`. */
export function MoreIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="3.25" r=".85" fill="currentColor" stroke="none" />
      <circle cx="8" cy="8" r=".85" fill="currentColor" stroke="none" />
      <circle cx="8" cy="12.75" r=".85" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 4h11M6.5 4V2.5h3V4M4 4l.6 8.4A1.2 1.2 0 005.8 13.5h4.4a1.2 1.2 0 001.2-1.1L12 4" />
      <path d="M6.75 6.75v4M9.25 6.75v4" />
    </Icon>
  );
}
