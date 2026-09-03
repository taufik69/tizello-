import { Icon, type IconProps } from "@/components/ui/icons";

/*
 * The app shell's glyph set — sidebar navigation, the collapse control and the
 * mobile drawer. Same 16px grid, same 1.5 stroke and the same `Icon` wrapper as
 * `icons.tsx`; they are two files only because one would exceed the 150-line
 * cap. Anything a *board* needs belongs next door, not here.
 */

export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 7L8 2.5 13.5 7v6a.5.5 0 01-.5.5H3a.5.5 0 01-.5-.5z" />
      <path d="M6.5 13.5v-4h3v4" />
    </Icon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5l3 3" />
    </Icon>
  );
}

export function ProjectsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 2l5.5 3L8 8 2.5 5z" />
      <path d="M2.5 8L8 11l5.5-3" />
      <path d="M2.5 11L8 14l5.5-3" />
    </Icon>
  );
}

export function MembersIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="6" cy="6" r="2.5" />
      <path d="M1.5 13.5a4.5 4.5 0 019 0" />
      <path d="M10.5 4a2.5 2.5 0 010 4.5M11.5 10a4.5 4.5 0 013 3.5" />
    </Icon>
  );
}

export function BacklogIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 4h11M2.5 8h11M2.5 12h7" />
    </Icon>
  );
}

export function SprintIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
      <path d="M6.5 2.5v11M10 2.5v7" />
    </Icon>
  );
}

export function PlanningIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
      <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
    </Icon>
  );
}

export function PanelLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2" y="3" width="12" height="10" rx="1.5" />
      <path d="M6.5 3v10" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </Icon>
  );
}

export function SignOutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 13.5H3.5a1 1 0 01-1-1v-9a1 1 0 011-1H6" />
      <path d="M10 5.5L12.5 8 10 10.5M12.5 8H6" />
    </Icon>
  );
}
