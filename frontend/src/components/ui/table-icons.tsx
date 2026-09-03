import { Icon, type IconProps } from "@/components/ui/icons";

/*
 * The glyphs a data table needs: one per column header, plus the toolbar and
 * the timeline's period stepper.
 *
 * A third icon file rather than a bigger one — `icons.tsx` is already at the
 * 150-line cap and `nav-icons.tsx` is the precedent for splitting on subject.
 * Same 16px grid, same 1.5 stroke, same `Icon` wrapper, so they compose.
 */

/** The ID column — `TIZ-3`. */
export function HashIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 2.5L4.5 13.5M11.5 2.5L10 13.5M2.5 5.5h11M2 10.5h11" />
    </Icon>
  );
}

/** Sits beside a project name, the way Notion marks a database page. */
export function DocIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 1.5H4.5A1.5 1.5 0 003 3v10a1.5 1.5 0 001.5 1.5h7A1.5 1.5 0 0013 13V5.5z" />
      <path d="M9 1.5V5.5h4" />
    </Icon>
  );
}

/** The Status column. */
export function TagIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 7.4V3a.5.5 0 01.5-.5h4.4a1 1 0 01.7.3l5.1 5.1a1 1 0 010 1.4l-4.4 4.4a1 1 0 01-1.4 0L2.8 8.6a1 1 0 01-.3-.7z" />
      <circle cx="5.6" cy="5.6" r=".9" />
    </Icon>
  );
}

/** Owner, Collaborators and Created by. */
export function PersonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="5.5" r="2.75" />
      <path d="M2.75 14a5.25 5.25 0 0110.5 0" />
    </Icon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
      <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
    </Icon>
  );
}

/** The Priority column. */
export function FlagIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 14V2.5M4 3h7.5l-1.5 2.75L11.5 8.5H4" />
    </Icon>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 3.5h11L9.25 8.6v4.4l-2.5-1.4V8.6z" />
    </Icon>
  );
}

export function SortIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 12.5V3.5M2.5 5.5l2-2 2 2" />
      <path d="M11.5 3.5v9M9.5 10.5l2 2 2-2" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 3.5L6 8l4 4.5" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 3.5L10 8l-4 4.5" />
    </Icon>
  );
}
