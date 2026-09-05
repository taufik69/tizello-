import { Icon, type IconProps } from "@/components/ui/icons";

/*
 * The companion apps and the utility rows at the foot of the sidebar. Same 16px
 * grid, same 1.5 stroke and the same `Icon` wrapper as `icons.tsx` and
 * `nav-icons.tsx`; a third file only because one would pass the 150-line cap.
 */

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
      <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
    </Icon>
  );
}

export function DesktopIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2" y="3" width="12" height="8" rx="1.5" />
      <path d="M8 11v2.5M6 13.5h4" />
    </Icon>
  );
}

export function TasksIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
      <path d="M5.5 8l1.8 1.8L10.5 6.2" />
    </Icon>
  );
}

export function TemplatesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="2.5" width="3" height="11" rx="1" />
      <rect x="6.5" y="2.5" width="3" height="11" rx="1" />
      <path d="M11.2 3.4l2.3.6-2.4 9.3-2.3-.6" />
    </Icon>
  );
}

export function MarketplaceIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 6.5h11v6a1 1 0 01-1 1h-9a1 1 0 01-1-1z" />
      <path d="M2 6.5L3.2 3h9.6L14 6.5" />
      <path d="M6.5 13.5v-4h3v4" />
    </Icon>
  );
}

export function HelpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M6.3 6.3a1.75 1.75 0 013.4.6c0 1.2-1.7 1.4-1.7 2.5" />
      <circle cx="8" cy="11.4" r=".75" fill="currentColor" stroke="none" />
    </Icon>
  );
}
